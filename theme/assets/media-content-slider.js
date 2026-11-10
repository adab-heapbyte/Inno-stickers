(function () {
  if (window.__mediaContentSlider) return;
  window.__mediaContentSlider = true;

  const SLIDE_FADE_MS = 700;
  const VIDEO_END_THRESHOLD_S = 0.05;

  class MediaContentSlider {
    constructor(el) {
      this.el = el;
      this.navItems = Array.from(
        el.querySelectorAll(".media-content__nav-item")
      );
      this.bullets = Array.from(el.querySelectorAll(".media-content__bullet"));
      this.visuals = Array.from(el.querySelectorAll(".media-content__visual"));
      this.total = this.visuals.length;

      if (this.total <= 1) return;

      this.current = 0;
      this.autoplay = el.dataset.autoplay === "true";
      this.delay = parseInt(el.dataset.delay, 10) || 6000;
      this.enableAutoDeley = el.dataset.enableAutoDeley === "true";
      this.raf = null;
      this.startTime = null;
      this.progressRunId = 0;
      this.isMobile = this._checkMobile();
      this.isInViewport = false;
      this.intersectionObserver = null;
      this._videoProgressCleanup = null;

      /* Clicking a nav item or bullet navigates to that slide */
      this.navItems.forEach((item, i) => {
        item.addEventListener("click", () => this._goTo(i));
      });
      this.bullets.forEach((btn, i) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation(); /* nav-item click already handles it */
          this._goTo(i);
        });
      });

      this.resizeObserver = new ResizeObserver(() => {
        this.isMobile = this._checkMobile();
      });
      this.resizeObserver.observe(this.el);

      this._updateBulletStates(this.current);
      this._setupIntersectionObserver();

      this.visuals.forEach((visual, i) => {
        if (i !== this.current) this._pauseSlideMedia(visual);
      });
    }

    destroy() {
      this._stopProgress();
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.intersectionObserver) this.intersectionObserver.disconnect();
    }

    _getActiveHtmlVideo() {
      const visual = this.visuals[this.current];
      if (!visual) return null;
      return visual.querySelector("video.media-content__video");
    }

    _pauseSlideMedia(visual) {
      if (!visual) return;

      visual.querySelectorAll("video.media-content__video").forEach((video) => {
        video.pause();
        video.currentTime = 0;
      });

      visual
        .querySelectorAll("iframe.media-content__video--iframe")
        .forEach((iframe) => {
          this._pauseIframe(iframe);
        });
    }

    _restartSlideMedia(visual) {
      if (!visual) return;

      visual.querySelectorAll("video.media-content__video").forEach((video) => {
        video.loop = false;
        video.currentTime = 0;
        video.play().catch(() => {});
      });

      visual
        .querySelectorAll("iframe.media-content__video--iframe")
        .forEach((iframe) => {
          this._restartIframe(iframe);
        });
    }

    _pauseIframe(iframe) {
      const src = iframe.src;

      if (src.includes("youtube.com")) {
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
        return;
      }

      if (src.includes("player.vimeo.com")) {
        iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
      }
    }

    _restartIframe(iframe) {
      const src = iframe.getAttribute("src");
      if (!src) return;
      iframe.setAttribute("src", src);
    }

    /* ── Navigation ── */

    _goTo(index) {
      if (index === this.current) return;
      this._stopProgress();

      const prev = this.current;
      this.current = index;

      /* Only the media panel transitions */
      this.visuals[prev].classList.remove("is-active");
      this.visuals[index].classList.add("is-active");

      this._pauseSlideMedia(this.visuals[prev]);
      this._restartSlideMedia(this.visuals[index]);

      /* Update nav items (opacity) */
      this.navItems[prev].classList.remove("is-active");
      this.navItems[index].classList.add("is-active");

      this._updateBulletStates(index);

      if (this.autoplay && this.isInViewport) this._startProgress();
    }

    _updateBulletStates(activeIndex) {
      this.bullets.forEach((btn, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;

        btn.classList.toggle("is-active", isActive);
        btn.classList.toggle("is-done", isDone);
        btn.setAttribute("aria-current", isActive ? "true" : "false");

        const fill = btn.querySelector(".media-content__bullet-fill");
        if (!fill) return;

        if (isDone) {
          fill.style.removeProperty("transform");
          return;
        }

        if (!isActive) {
          fill.style.transform = this._fillTransform(0);
        }
      });

      const activeBullet = this.bullets[activeIndex];
      if (activeBullet) {
        this._setFill(activeBullet, 0);
      }
    }

    _next() {
      this._goTo((this.current + 1) % this.total);
    }

    _advanceFromVideoEnd(runId) {
      if (runId !== this.progressRunId) return;

      const video = this._getActiveHtmlVideo();
      if (video) {
        video.loop = false;
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.max(video.duration - 0.001, 0);
        }
        video.pause();
      }

      this._stopProgress(false);
      this._next();
    }

    /* ── Progress animation ── */

    _startProgress() {
      if (!this.autoplay || !this.isInViewport) return;

      this._stopProgress();
      this._updateBulletStates(this.current);

      const video = this._getActiveHtmlVideo();
      if (this.enableAutoDeley && video) {
        this._startVideoSyncedProgress(video);
        return;
      }

      this._startTimerProgress();
    }

    _startVideoSyncedProgress(video) {
      const runId = ++this.progressRunId;
      const bullet = this.bullets[this.current];
      if (!bullet) return;

      const beginSync = () => {
        if (runId !== this.progressRunId) return;
        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          this._startTimerProgress();
          return;
        }

        video.loop = false;

        const onTimeUpdate = () => {
          if (runId !== this.progressRunId) return;

          const progress = Math.min(video.currentTime / video.duration, 1);
          this._setFill(bullet, progress);

          const remaining = video.duration - video.currentTime;
          if (remaining <= VIDEO_END_THRESHOLD_S) {
            this._advanceFromVideoEnd(runId);
          }
        };

        const onEnded = () => {
          this._advanceFromVideoEnd(runId);
        };

        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("ended", onEnded);

        this._videoProgressCleanup = () => {
          video.removeEventListener("timeupdate", onTimeUpdate);
          video.removeEventListener("ended", onEnded);
        };

        if (video.paused) {
          video.play().catch(() => {});
        }

        onTimeUpdate();
      };

      if (
        video.readyState >= 1 &&
        Number.isFinite(video.duration) &&
        video.duration > 0
      ) {
        beginSync();
        return;
      }

      const onReady = () => beginSync();
      video.addEventListener("loadedmetadata", onReady, { once: true });
      this._videoProgressCleanup = () => {
        video.removeEventListener("loadedmetadata", onReady);
      };
    }

    _startTimerProgress() {
      const currentDelay = this._getCurrentSlideDelay();
      const runId = ++this.progressRunId;
      const bullet = this.bullets[this.current];
      if (!bullet) return;

      this.startTime = null;
      const tick = (timestamp) => {
        if (runId !== this.progressRunId) return;

        if (this.startTime === null) this.startTime = timestamp;

        const progress = Math.min(
          (timestamp - this.startTime) / currentDelay,
          1
        );
        this._setFill(bullet, progress);

        if (progress < 1) {
          this.raf = requestAnimationFrame(tick);
          return;
        }

        this._next();
      };

      this.raf = requestAnimationFrame(tick);
    }

    _stopProgress(clearVideoListeners = true) {
      this.progressRunId += 1;
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      }
      this.startTime = null;

      if (clearVideoListeners && this._videoProgressCleanup) {
        this._videoProgressCleanup();
        this._videoProgressCleanup = null;
      }
    }

    _fillTransform(progress) {
      return `scaleY(${progress})`;
    }

    _setFill(bullet, progress) {
      if (!bullet?.classList.contains("is-active")) return;

      const fill = bullet.querySelector(".media-content__bullet-fill");
      if (!fill) return;

      fill.style.transform = this._fillTransform(progress);
    }

    _checkMobile() {
      return window.matchMedia("(max-width: 989px)").matches;
    }

    _setupIntersectionObserver() {
      if (!this.autoplay) return;

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible =
            !!entry && entry.isIntersecting && entry.intersectionRatio >= 0.2;

          if (visible === this.isInViewport) return;
          this.isInViewport = visible;

          if (this.isInViewport) {
            this._startProgress();
          } else {
            this._stopProgress();
          }
        },
        {
          threshold: [0, 0.2, 1],
        }
      );

      this.intersectionObserver.observe(this.el);
    }

    _getCurrentSlideDelay() {
      if (!this.enableAutoDeley) return this.delay;

      const currentVisual = this.visuals[this.current];
      if (!currentVisual) return this.delay;

      let durationSeconds = parseFloat(
        currentVisual.dataset.videoDuration || "0"
      );
      if (!Number.isFinite(durationSeconds)) durationSeconds = 0;

      const htmlVideo = currentVisual.querySelector(
        "video.media-content__video"
      );
      if (
        htmlVideo &&
        Number.isFinite(htmlVideo.duration) &&
        htmlVideo.duration > 0
      ) {
        durationSeconds = Math.max(durationSeconds, htmlVideo.duration);
      }

      if (durationSeconds > 1000) {
        durationSeconds = durationSeconds / 1000;
      }

      if (durationSeconds <= 0) return this.delay;

      let remainingSeconds = durationSeconds;

      if (
        htmlVideo &&
        Number.isFinite(htmlVideo.currentTime) &&
        htmlVideo.currentTime >= 0 &&
        htmlVideo.currentTime < durationSeconds
      ) {
        remainingSeconds = Math.max(durationSeconds - htmlVideo.currentTime, 0);
      }

      const videoBasedDelay = Math.max(
        Math.ceil(remainingSeconds * 1000 - SLIDE_FADE_MS),
        0
      );

      return videoBasedDelay;
    }
  }

  function initMediaContentSliders(root = document) {
    const elements =
      root === document
        ? document.querySelectorAll(".media-content")
        : root.querySelectorAll(".media-content");

    elements.forEach((el) => {
      if (!el._mediaContentInstance) {
        el._mediaContentInstance = new MediaContentSlider(el);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      initMediaContentSliders()
    );
  } else {
    initMediaContentSliders();
  }

  /* Shopify theme editor: re-init on section reload */
  document.addEventListener("shopify:section:load", (e) => {
    e.target.querySelectorAll(".media-content").forEach((el) => {
      if (el._mediaContentInstance) {
        el._mediaContentInstance.destroy();
        el._mediaContentInstance = null;
      }
      el._mediaContentInstance = new MediaContentSlider(el);
    });
  });
})();
