"use strict";

let preloader;

let Layout = function () {

  let self = this;

  this.init = function () {
    window.onload = function () {
      self.bodyLoaded();
      self.lazyFunc();
    };
    document.querySelector("body").classList.add("ready");
    self.ieStubFunc();
    self.safariClass();
    self.sideMenu();
    self.animHeader();
    self.audioInit();

    preloader = new self.Preloader(); // preloader.start(selector) || preloader.stop(selector) to start or stop preloader;
  };

  this.bodyLoaded = function () {
    document.querySelector("body").classList.add("loaded-page");
  };

  this.lazyMethod = function () {
    self.lazyFunc();
  };

  this.ieStubFunc = function () {
    let isIE = /*@cc_on!@*/false || !!document.documentMode;
    let isIE11 = !!navigator.userAgent.match(/Trident.*rv\:11\./);
    if (isIE11 || isIE) {
      document.body.classList.add("ie");
      let ieStub = "<div class=\"ie-detect\" style=\"display\: none;\"><b>Your browser is out of date</b><p>You are using an obsolete browser that does not support modern web standards and poses a security risk.</p><p>Please update your browser or download a modern version.</p><p>Internet Explorer is no longer supported.</p></div>";
      document.querySelector("body").classList.add("ie");
      document.querySelector(".main-grid-wrapper").innerHTML = ieStub;
    }
    ;
  };

  this.safariClass = function () {
    let is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (is_safari) {
      document.querySelector("body").classList.add("safari");
    }
  };

  this.Preloader = function () {

    let selff = this;

    selff.start = function (selector) {
      let prel = document.createElement("div");
      prel.classList.add("preloader-overlay");
      let prelHml = "<svg class='spinner' width='174px' height='174px' viewBox='0 0 66 66' xmlns='http://www.w3.org/2000/svg'><circle class='path' fill='transparent' stroke-width='2' cx='33' cy='33' r='30' stroke='url(#gradient)'/><linearGradient id='gradient'><stop offset='50%' stop-color='#ffffff' stop-opacity='1'/><stop offset='65%' stop-color='#3555AF' stop-opacity='.5'/><stop offset='100%' stop-color='#3555AF' stop-opacity='0'/></linearGradient></circle><svg class='spinner-dot dot' width='5px' height='5px' viewBox='0 0 66 66' xmlns='http://www.w3.org/2000/svg' x='37' y='1.5'><circle class='path' fill='#3555AF' cx='33' cy='33' r='30'/></circle></svg></svg>";
      prel.innerHTML = prelHml;
      document.querySelector(selector).appendChild(prel);
      prel.parentNode.style.opacity = "0.85";
    },

      selff.stop = function (selector) {
        if (document.querySelector(".preloader-overlay")) {
          document.querySelector(".preloader-overlay").parentNode.style.opacity = "";
          document.querySelector(selector).querySelector(".preloader-overlay").remove();
        }
      };
  };

  this.animHeader = function () {
    let scrollpos = window.scrollY;
    let header = document.querySelector(".header-wg");
    let contentWg = document.querySelector(".content-wg");
    let flagHeader = "anim";

    function add_class_on_scroll() {
      header.classList.add("anima");
      contentWg.classList.add("anima");
    }

    function remove_class_on_scroll() {
      header.classList.remove("anima");
      contentWg.classList.remove("anima");
    }

    function calc_on_scroll() {
      scrollpos = window.scrollY;

      if ((scrollpos > 75) && (flagHeader === "anim")) {
        add_class_on_scroll();
        flagHeader = "end";
      }
      if ((scrollpos <= 75) && (flagHeader === "end")) {
        remove_class_on_scroll();
        flagHeader = "anim";
      }
    }

    calc_on_scroll();
    document.body.classList.add("down");
    window.onwheel = e => {
      if(e.deltaY >= 0){
        document.querySelector("body").classList.add("down");
        document.querySelector("body").classList.remove("up");
      } else {
        document.querySelector("body").classList.add("up");
        document.querySelector("body").classList.remove("down");
      }
    }

    window.addEventListener('scroll', function () {
      calc_on_scroll();
    });


  };

  this.sideMenu = function () {
    let headerPopup = document.querySelector(".header-popup");
    let gamburgerBtn = document.querySelector(".gamburger");
    let menuCloseLink = document.querySelector(".header-popup__close");
    let menuLink = document.querySelectorAll(".header-popup a");
    let bodyEl = document.querySelector("body");
    let activeLinkMenu = document.querySelectorAll(".header-top nav ul li a");

    function hideSideMenu() {
      headerPopup.classList.remove("open");
      bodyEl.removeAttribute('data-hidden');
      // gamburgerBtn?.classList.remove("header-popup__close");
    };

    function showSideMenu() {
      headerPopup.classList.add("open");
      bodyEl.setAttribute('data-hidden', ':hidden');
    };

    gamburgerBtn?.addEventListener("click", function (e) {
      e.preventDefault();
      // this.classList.toggle("header-popup__close");
      this.classList.contains("header-popup__close") ? hideSideMenu() : showSideMenu();
    });

    headerPopup?.addEventListener('click', function (event) {
      let e = document.querySelector('.header-popup__block');
      if (!e.contains(event.target)) {
        // hideSideMenu();
      }
    });


    menuCloseLink?.addEventListener("click", function () {
      hideSideMenu();
    });
    for (let i = 0; i < menuLink.length; i++) {
      menuLink[i].addEventListener("click", function (e) {
        hideSideMenu();
      });
    }

    for (let i = 0; i < activeLinkMenu.length; i++) {
      if (activeLinkMenu[i].classList.contains("active")) {
        activeLinkMenu[i].parentNode.classList.add("act") || activeLinkMenu[i].parentNode.parentNode.parentNode.classList.add("act");
      } else {
        activeLinkMenu[i].parentNode.classList.remove("act");
      }
    }
  };

  this.lazyFunc = function () {
    if ('NodeList' in window && !NodeList.prototype.forEach) {
      console.info('polyfill for IE11');
      NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
          callback.call(thisArg, this[i], i, this);
        }
      };
    }
    var lazyloadImages;

    if ("IntersectionObserver" in window) {
      lazyloadImages = document.querySelectorAll(".lazyClass");
      var imageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var image = entry.target;
            image.src = image.dataset.src;
            image.classList.remove("lazyClass");
            if (image.classList.contains('lazyBg')) {
              image.classList.remove("lazyBg");
              image.setAttribute('style', 'background-image: url(' + image.src + ')');
            }
            image.classList.add("visible");

            if (image.dataset.placeholder) {
              image.src = image.dataset.src;
            }

            imageObserver.unobserve(image);
          }
        });
      });

      lazyloadImages.forEach(function (image) {
        imageObserver.observe(image);
      });
    } else {
      var lazyloadThrottleTimeout;
      lazyloadImages = document.querySelectorAll(".lazyClass");

      function lazyload() {
        if (lazyloadThrottleTimeout) {
          clearTimeout(lazyloadThrottleTimeout);
        }

        lazyloadThrottleTimeout = setTimeout(function () {
          var scrollTop = window.pageYOffset;
          lazyloadImages.forEach(function (img) {
            if (img.offsetTop < (window.innerHeight + scrollTop)) {
              img.src = img.dataset.src;
              img.classList.remove('lazyClass');
              if (img.classList.contains('lazyBg')) {
                img.classList.remove("lazyBg");
                img.setAttribute('style', 'background-image: url(' + img.src + ')');
              }
              img.classList.add("visible");
            }
          });
          if (lazyloadImages.length == 0) {
            document.removeEventListener("scroll", lazyload);
            window.removeEventListener("resize", lazyload);
            window.removeEventListener("orientationChange", lazyload);
          }
        }, 20);
      }

      document.addEventListener("scroll", lazyload);
      window.addEventListener("resize", lazyload);
      window.addEventListener("orientationChange", lazyload);
    }
  };

  this.audioInit = function (path, volume = 0.5) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.loop = true;
    let isInitialized = false;
    const toggleAudio = () => {
      if (audio.paused) {
        audio.play().catch(err => console.warn("Playback blocked:", err));
        document.querySelectorAll('.icon--sound').forEach(el => el.classList.add('is-active'));
        document.querySelectorAll('.icon--sound').forEach(el => el.classList.remove('is-paused'));
      } else {
        audio.pause();
        document.querySelectorAll('.icon--sound').forEach(el => el.classList.remove('is-active'));
        document.querySelectorAll('.icon--sound').forEach(el => el.classList.add('is-paused'));
      }
    };

    const unlockAudio = () => {
      if (isInitialized) return;

      audio.play().then(() => {
        isInitialized = true;
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        document.querySelectorAll('.icon--sound').forEach(el => el.classList.add('is-active'));
      }).catch(() => {
      });
    };
    unlockAudio();
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    document.addEventListener('click', (e) => {
      const soundBtn = e.target.closest('.icon--sound');
      if (soundBtn) {
        e.preventDefault();
        toggleAudio();
      }
    });

    return audio;
  }

};

let layout = new Layout();

document.addEventListener("DOMContentLoaded", function () {
  // let layout = new Layout();
  layout.init();
  new Layout().lazyMethod();

  // Запуск
  const bgMusic = layout.audioInit('https://cdn.prod.website-files.com/69ecf834c96f1affa1096a2a/69ed448657818795fe26dab7_astron-cold-blue.mp3');

});
