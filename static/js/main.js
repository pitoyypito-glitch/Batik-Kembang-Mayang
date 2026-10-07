document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});

/* Koleksi: carousel motif yang bisa digeser lewat panah, titik, atau swipe. */
document.addEventListener("DOMContentLoaded", function () {
  var track = document.getElementById("motifTrack");
  if (!track) return;

  var prevBtn = document.querySelector(".carousel-prev");
  var nextBtn = document.querySelector(".carousel-next");
  var cards = Array.prototype.slice.call(
    track.querySelectorAll("[data-motif-card]")
  );
  var dots = Array.prototype.slice.call(
    document.querySelectorAll("[data-motif-dot]")
  );

  var cardStep = function () {
    if (!cards.length) return 0;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || "0") || 0;
    return cards[0].getBoundingClientRect().width + gap;
  };

  var updateControls = function () {
    var max = track.scrollWidth - track.clientWidth - 2;
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= max;

    if (dots.length) {
      var step = cardStep() || 1;
      var active = Math.round(track.scrollLeft / step);
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
      });
    }
  };

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      track.scrollBy({ left: -cardStep(), behavior: "smooth" });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      track.scrollBy({ left: cardStep(), behavior: "smooth" });
    });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      cards[i].scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    });
  });

  var ticking = false;
  track.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          updateControls();
          ticking = false;
        });
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", updateControls);
  updateControls();
});

/* Beranda: kamus batik, kartu istilah yang bisa dibalik dengan ketukan/klik. */
document.addEventListener("DOMContentLoaded", function () {
  var cards = document.querySelectorAll(".kamus-card");
  if (!cards.length) return;

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      var flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", flipped ? "true" : "false");
    });
  });
});

/* Animasi kotak kain di "Dari canting hingga kain": terisi saat terlihat. */
document.addEventListener("DOMContentLoaded", function () {
  var steps = document.querySelectorAll(".process-step");
  if (!steps.length) return;

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // tampilkan hasil akhir saja

  document.documentElement.classList.add("js");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 }
  );
  steps.forEach(function (step) {
    observer.observe(step);
  });
});

/* Beranda: kemunculan saat di-scroll, parallax hero, dan proses membatik. */
document.addEventListener("DOMContentLoaded", function () {
  var root = document.documentElement;
  var hasIO = "IntersectionObserver" in window;
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* kemunculan bertahap */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && hasIO && !reduce) {
    root.classList.add("js");
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    reveals.forEach(function (el) {
      revealIO.observe(el);
    });
  }

  /* parallax foto hero */
  var media = document.querySelector("[data-parallax]");
  if (media && !reduce) {
    var ticking = false;
    var update = function () {
      var y = window.scrollY || window.pageYOffset;
      if (y < 1400) media.style.transform = "translate3d(0," + y * 0.18 + "px,0)";
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  /* proses membatik: kain berubah mengikuti langkah yang sedang dibaca */
  var ps = document.querySelector(".ps");
  if (ps && hasIO) {
    var cloth = ps.querySelector(".ps-cloth");
    var steps = ps.querySelectorAll(".ps-step");
    var dots = ps.querySelectorAll(".ps-dots li");
    var labelNum = ps.querySelector(".ps-label-num");
    var labelTitle = ps.querySelector(".ps-label-title");
    var word = cloth.getAttribute("data-step-word");
    var blank = cloth.getAttribute("data-blank");

    var setStage = function (n) {
      cloth.setAttribute("data-stage", n);
      steps.forEach(function (step, i) {
        step.classList.toggle("is-active", i + 1 === n);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i + 1 === n);
      });
      if (n === 0) {
        labelNum.textContent = "";
        labelTitle.textContent = blank;
      } else {
        labelNum.textContent = word + " " + n + " / " + steps.length;
        labelTitle.textContent = steps[n - 1].querySelector("h3").textContent;
      }
    };

    ps.classList.add("ps-js");
    setStage(0);

    var stageIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var n = parseInt(entry.target.getAttribute("data-step"), 10);
          if (entry.isIntersecting) {
            setStage(n);
          } else if (n === 1 && entry.boundingClientRect.top > 0) {
            setStage(0); // digulir kembali ke atas langkah pertama
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.forEach(function (step) {
      stageIO.observe(step);
    });
  }
});

/* Tentang Kami: timeline "dicanting", angka menghitung naik, salam ditulis. */
document.addEventListener("DOMContentLoaded", function () {
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  if (reduce) return; // tampilkan hasil akhir saja

  /* 1. timeline: garis malam tergambar mengikuti scroll */
  var tl = document.querySelector(".timeline");
  if (tl) {
    var items = tl.querySelectorAll(".timeline-item");
    var ticking = false;
    var updateTimeline = function () {
      var rect = tl.getBoundingClientRect();
      var head = window.innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, (head - rect.top) / rect.height));
      var y = p * rect.height;
      tl.style.setProperty("--p", p.toFixed(4));
      tl.classList.toggle("tl-idle", p <= 0 || p >= 1);
      items.forEach(function (item) {
        item.classList.toggle("is-lit", item.offsetTop + 8 <= y);
      });
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateTimeline);
      }
    };
    tl.classList.add("tl-js");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateTimeline();
  }

  if (!hasIO) return;

  /* 3a. Jejak Kami: garis malam bergelombang tergambar, angka naik di tiap titik */
  var jejak = document.querySelector(".jejak");
  if (jejak) {
    var nums = jejak.querySelectorAll(".num[data-count]");
    var counted = [];
    nums.forEach(function (el) {
      var m = el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/);
      if (!m) return;
      el._count = {
        pre: m[1],
        end: parseInt(m[2], 10),
        suf: m[3],
        from: parseInt(el.getAttribute("data-from") || "0", 10),
        delay: parseInt(el.getAttribute("data-delay") || "0", 10),
      };
      el.textContent = m[1] + el._count.from + m[3];
      counted.push(el);
    });
    jejak.classList.add("jejak-js");
    var jejakIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          jejak.classList.add("is-in");
          counted.forEach(function (el) {
            var c = el._count;
            var start = null;
            var tick = function (now) {
              if (start === null) start = now + c.delay;
              var t = Math.min(1, Math.max(0, (now - start) / 1500));
              var eased = 1 - Math.pow(1 - t, 3);
              el.textContent = c.pre + Math.round(c.from + (c.end - c.from) * eased) + c.suf;
              if (t < 1) window.requestAnimationFrame(tick);
            };
            window.requestAnimationFrame(tick);
          });
          jejakIO.unobserve(jejak);
        });
      },
      { threshold: 0.4 }
    );
    jejakIO.observe(jejak);
  }

  /* 3b. "Salam Canting" ditulis huruf demi huruf */
  var salam = document.querySelector(".salam-write");
  if (salam) {
    salam.classList.add("sw-js");
    var salamIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            salam.classList.add("is-written");
            salamIO.unobserve(salam);
          }
        });
      },
      { threshold: 0.6 }
    );
    salamIO.observe(salam);
  }
  /* 4. Foto pendamping sanggar: klik untuk memperbesar */
  var certDialog = document.querySelector("[data-certified-dialog]");
  var certOpen = document.querySelector("[data-certified-open]");
  if (certDialog && certOpen && certDialog.showModal) {
    certOpen.addEventListener("click", function () {
      certDialog.showModal();
    });
    certDialog.addEventListener("click", function () {
      certDialog.close();
    });
  }
});


/* Pratinjau brosur: satu halaman per layar. Geser, panah, titik, atau tombol keyboard. */
document.addEventListener("DOMContentLoaded", function () {
  var modal = document.getElementById("brochureModal");
  var openers = document.querySelectorAll("[data-brochure-open]");
  if (!modal || !openers.length) return;

  var track = modal.querySelector(".brochure-track");
  var slides = modal.querySelectorAll(".brochure-slide");
  var dots = modal.querySelectorAll("[data-brochure-dot]");
  var prev = modal.querySelector("[data-brochure-prev]");
  var next = modal.querySelector("[data-brochure-next]");
  var current = modal.querySelector("[data-brochure-current]");
  var total = slides.length;
  var lastFocus = null;
  var index = 0;
  var target = null; // halaman tujuan saat animasi geser berjalan
  var targetTimer = null;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var update = function (i) {
    index = i;
    if (current) current.textContent = i + 1;
    dots.forEach(function (d, n) {
      d.classList.toggle("is-active", n === i);
      if (n === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === total - 1;
  };

  var goTo = function (i, instant) {
    i = Math.max(0, Math.min(total - 1, i));
    target = instant || reduceMotion ? null : i;
    clearTimeout(targetTimer);
    if (target !== null) targetTimer = setTimeout(function () { target = null; }, 700);
    track.scrollTo({
      left: i * track.clientWidth,
      behavior: instant || reduceMotion ? "auto" : "smooth",
    });
    update(i);
  };

  var open = function (e) {
    e.preventDefault();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("brochure-open");
    slides.forEach(function (s) {
      var img = s.querySelector("img");
      if (img) img.loading = "eager";
    });
    goTo(0, true);
    var closeBtn = modal.querySelector(".brochure-x");
    if (closeBtn) closeBtn.focus();
  };

  var close = function () {
    modal.hidden = true;
    document.body.classList.remove("brochure-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  openers.forEach(function (el) {
    el.addEventListener("click", open);
  });
  modal.querySelectorAll("[data-brochure-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });

  // ketuk area kosong di samping halaman untuk menutup
  slides.forEach(function (s) {
    s.addEventListener("click", function (e) {
      if (e.target === s) close();
    });
  });

  if (prev) prev.addEventListener("click", function () { goTo(index - 1); });
  if (next) next.addEventListener("click", function () { goTo(index + 1); });
  dots.forEach(function (d) {
    d.addEventListener("click", function () {
      goTo(parseInt(d.getAttribute("data-brochure-dot"), 10));
    });
  });

  // sinkronkan penanda saat digeser dengan jari/trackpad
  track.addEventListener(
    "scroll",
    function () {
      if (!track.clientWidth) return;
      if (target !== null) {
        // abaikan posisi sementara selama animasi menuju halaman tujuan
        if (Math.abs(track.scrollLeft - target * track.clientWidth) < 2) target = null;
        return;
      }
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== index) update(i);
    },
    { passive: true }
  );

  // jaga halaman tetap pas saat ukuran layar berubah
  window.addEventListener("resize", function () {
    if (!modal.hidden) goTo(index, true);
  });

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") goTo(index + 1);
    else if (e.key === "ArrowLeft") goTo(index - 1);
  });
});


/* Video beranda: otomatis diputar (tanpa suara) saat bagiannya terlihat di layar,
   dan dijeda lagi saat discroll keluar. Suara bisa dinyalakan lewat kontrol video. */
document.addEventListener("DOMContentLoaded", function () {
  var video = document.querySelector("video[data-scroll-play]");
  if (!video || !("IntersectionObserver" in window)) return;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  video.muted = true;
  var pausedByUser = false;
  var pausedByScroll = false;

  video.addEventListener("pause", function () {
    // jeda yang bukan karena scroll berarti pengunjung menjedanya sendiri
    if (!pausedByScroll && !video.ended) pausedByUser = true;
  });
  video.addEventListener("play", function () {
    pausedByUser = false;
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!pausedByUser) {
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else if (!video.paused) {
          pausedByScroll = true;
          video.pause();
          pausedByScroll = false;
        } else if (!entry.isIntersecting) {
          // keluar layar: reset supaya masuk lagi otomatis diputar
          pausedByUser = false;
        }
      });
    },
    { threshold: [0, 0.6] }
  );
  observer.observe(video);
});
