document.addEventListener('DOMContentLoaded', () => {
    // 1. Preloader
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800);
    }, 500);

    // 1.5 Premium Smooth Scroll (Lenis) — Desktop only
    // On touch devices (iPad, mobile), native momentum scrolling is already smooth
    // and works perfectly with ScrollTrigger. Lenis would break ScrollTrigger on iOS
    // because it intercepts scroll events but doesn't track touch scroll position,
    // causing lenis.scroll to always be 0 and all ScrollTrigger animations to never fire.
    let lenis;
    // iOS Safari Incognito/Anti-Fingerprinting can spoof maxTouchPoints to 0 and remove ontouchstart.
    // We use a robust combination of checks to definitively identify touch devices and iPads.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches || isIOS;

    if (typeof Lenis !== 'undefined' && !isTouch) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0, 0);
        } else {
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    // 2. Custom Cursor & Magnetic Buttons
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    if (window.innerWidth > 1024 && !isTouch && cursorDot && cursorOutline && typeof gsap !== 'undefined') {
        
        // GSAP quickTo for highly performant cursor tracking
        gsap.set([cursorDot, cursorOutline], { xPercent: -50, yPercent: -50 });
        
        const xSetDot = gsap.quickSetter(cursorDot, "x", "px");
        const ySetDot = gsap.quickSetter(cursorDot, "y", "px");
        
        const xToOutline = gsap.quickTo(cursorOutline, "x", {duration: 0.15, ease: "power3"});
        const yToOutline = gsap.quickTo(cursorOutline, "y", {duration: 0.15, ease: "power3"});

        window.addEventListener('mousemove', (e) => {
            xSetDot(e.clientX);
            ySetDot(e.clientY);
            xToOutline(e.clientX);
            yToOutline(e.clientY);
        });

        // Hover effect on interactables
        const interactables = document.querySelectorAll('a, button, .magnetic, .glass-card');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
        });

        // GSAP Performance Magnetic Logic (Buttons & Gallery Images)
        const magneticElements = document.querySelectorAll('.magnetic-btn, .gallery-image img');
        magneticElements.forEach(el => {
            const isImg = el.tagName.toLowerCase() === 'img';
            const strength = isImg ? 0.1 : 0.3;
            
            const xTo = gsap.quickTo(el, "x", {duration: 1, ease: "elastic.out(1, 0.3)"});
            const yTo = gsap.quickTo(el, "y", {duration: 1, ease: "elastic.out(1, 0.3)"});

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const h = rect.width / 2;
                const v = rect.height / 2;
                const x = e.clientX - rect.left - h;
                const y = e.clientY - rect.top - v;
                
                xTo(x * strength);
                yTo(y * strength);
                if (isImg) gsap.to(el, { scale: 1.05, duration: 0.3 });
            });

            el.addEventListener('mouseleave', () => {
                xTo(0);
                yTo(0);
                if (isImg) gsap.to(el, { scale: 1, duration: 0.5, ease: "power2.out" });
            });
        });

        // "View" Cursor on Gallery Items
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('view-hover');
                cursorDot.classList.add('hidden');
                cursorOutline.classList.remove('hover');
            });
            item.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('view-hover');
                cursorDot.classList.remove('hidden');
            });
        });
    }

    // 3. Navbar & Mobile Menu
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    navItems.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSec = document.querySelector(targetId);
            
            if (targetSec) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                
                let offset = -80;
                
                // For About section, scroll deep into the pinned area so the user sees the fully assembled content
                if (targetId === '#about') {
                    offset = window.innerHeight * 1.2;
                }
                
                if (typeof lenis !== 'undefined' && lenis) {
                    lenis.scrollTo(targetSec, { offset: offset });
                } else {
                    window.scrollTo({
                        top: targetSec.offsetTop + offset,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Highlight active section based on scroll using IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Trigger when section is in the middle 20% of viewport
        threshold: 0 // Avoid percentage thresholds because tall sections will never satisfy them
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                // Sync top nav
                navItems.forEach(a => {
                    a.classList.remove('active');
                    if (a.getAttribute('href') === `#${currentId}`) {
                        a.classList.add('active');
                    }
                });
                // Sync side dots
                document.querySelectorAll('.section-dots .dot').forEach(d => {
                    d.classList.remove('active');
                    if (d.getAttribute('href') === `#${currentId}`) {
                        d.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(sec => {
        observer.observe(sec);
    });

    // 4. Hero Animated Text (Rotating words - Premium GSAP effect)
    const words = document.querySelectorAll('.animated-words .word');
    if (words.length > 0 && typeof gsap !== 'undefined') {
        // Initialize state
        gsap.set(words, { opacity: 0, y: 30, rotationX: -90, position: 'absolute' });
        gsap.set(words[0], { opacity: 1, y: 0, rotationX: 0, position: 'relative' });

        let currentWordIndex = 0;
        setInterval(() => {
            const currentWord = words[currentWordIndex];
            currentWordIndex = (currentWordIndex + 1) % words.length;
            const nextWord = words[currentWordIndex];

            const tl = gsap.timeline();
            tl.to(currentWord, { 
                opacity: 0, y: -30, rotationX: 90, duration: 0.6, ease: 'power2.in',
                onComplete: () => gsap.set(currentWord, { position: 'absolute' }) 
            })
            .set(nextWord, { position: 'relative' }, "<0.3")
            .fromTo(nextWord, 
                { opacity: 0, y: 30, rotationX: -90 }, 
                { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'back.out(1.5)' }, 
                "<"
            );
        }, 3000);
    }

    // 5. Scrollytelling & GSAP Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // -- Hero Section Split Text (Load Animation) --
        const splitTitle = document.getElementById('split-title');
        if (splitTitle) {
            const text = splitTitle.innerText;
            splitTitle.innerHTML = text.split('').map(char => `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`).join('');

            gsap.fromTo('.char',
                { y: 100, opacity: 0, rotateX: -90 },
                { y: 0, opacity: 1, rotateX: 0, stagger: 0.04, duration: 1.5, ease: 'power4.out', delay: 0.2, immediateRender: true }
            );
        }

        // -- Cinematic Section Titles (Scroll Reveal) --
        if (typeof SplitType !== 'undefined') {
            const sectionTitles = document.querySelectorAll('.section-title:not([data-no-split])');
            sectionTitles.forEach(title => {
                const text = new SplitType(title, { types: 'chars' });
                gsap.from(text.chars, {
                    scrollTrigger: {
                        trigger: title,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    },
                    y: 50,
                    opacity: 0,
                    rotateX: -90,
                    stagger: 0.02,
                    duration: 1,
                    ease: 'back.out(1.7)'
                });
            });
        }

        // -- Scroll Progress Bar --
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            gsap.to(progressBar, {
                width: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: document.documentElement,
                    start: 'top top',
                    end: 'max', // Use max to account for pin spacing added dynamically
                    scrub: 0.1
                }
            });
        }

            // -- Section Dots Navigation --
            const dots = document.querySelectorAll('.section-dots .dot');

            // Smooth scroll to section when dot is clicked
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = dot.getAttribute('href');
                    const targetSec = document.querySelector(targetId);
                    if (targetSec) {
                        window.scrollTo({
                            top: targetSec.offsetTop,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // -- Responsive GSAP Animations with matchMedia --
            let mm = gsap.matchMedia();

            // 1. Desktop Only Animations (>1366px and no touch)
            mm.add("(min-width: 1367px)", () => {
                if (isTouch) return;
                
                // Hero Pinning
                const heroTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#home',
                        start: 'top top',
                        end: '+=100%',
                        scrub: 1,
                        pin: true
                    }
                });
                heroTl.to('.main-title', { scale: 0.8, opacity: 0, y: -100, duration: 1 })
                      .to('.subtitle', { opacity: 0, y: -50, duration: 1 }, "<");
                      
                // About Parallax
                const aboutTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#about',
                        start: 'top top',
                        end: '+=200%',
                        scrub: 1,
                        pin: true
                    }
                });
                aboutTl.from('.first-name', { x: -200, opacity: 0, duration: 1 })
                       .from('.profile-wrapper', { scale: 0.5, opacity: 0, duration: 1 }, "-=0.5")
                       .from('.last-name', { x: 200, opacity: 0, duration: 1 }, "-=0.5")
                       .from('.info-card', { y: 80, opacity: 0, stagger: 0.2, duration: 1 }, "-=0.3")
                       .to({}, { duration: 3 });
            });

            // 2. Timeline Scroll Progress (High Performance ScrollTrigger replacing requestAnimationFrame)
            const allTimelines = document.querySelectorAll('.timeline');
            allTimelines.forEach(timeline => {
                const progress = timeline.querySelector('.timeline-progress');
                if (progress) {
                    gsap.fromTo(progress, 
                        { scaleY: 0 },
                        {
                            scaleY: 1,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: timeline,
                                start: 'top center',
                                end: 'bottom center',
                                scrub: true
                            }
                        }
                    );
                }
            });

            // 3. Desktop Timeline Steps (>768px and no touch)
            mm.add("(min-width: 769px)", () => {
                if (isTouch) return;
                
                gsap.utils.toArray('.timeline-step').forEach((step) => {
                    const isLeft = step.classList.contains('left');
                    gsap.from(step, {
                        scrollTrigger: {
                            trigger: step,
                            start: 'top 80%',
                            end: 'top 30%',
                            scrub: 1,
                        },
                        x: isLeft ? -100 : 100,
                        opacity: 0,
                        rotateY: isLeft ? -15 : 15,
                    });
                });
            });

            // 4. Portfolio Horizontal Scroll (Responsive track width)
            mm.add({
                isPhone: "(max-width: 768px)",
                isBigger: "(min-width: 769px)"
            }, (context) => {
                const track = document.querySelector(".horizontal-track");
                const slides = gsap.utils.toArray(".h-slide");
                
                if (track && slides.length > 0) {
                    const slideWidth = context.conditions.isPhone ? 100 : 50;
                    const totalWidth = slides.length * slideWidth;
                    track.style.width = `${totalWidth}vw`;

                    const horizontalScroll = gsap.to(track, {
                        x: () => -track.scrollWidth,
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".portfolio-section",
                            start: "top top",
                            end: () => `+=${track.scrollWidth}`,
                            scrub: true,
                            pin: true,
                            anticipatePin: 1,
                            invalidateOnRefresh: true
                        }
                    });

                    slides.forEach(slide => {
                        const img = slide.querySelector(".gallery-image img");
                        if (img) {
                            gsap.from(img, {
                                scale: 1.3,
                                scrollTrigger: {
                                    trigger: slide,
                                    containerAnimation: horizontalScroll,
                                    start: "left right",
                                    end: "right left",
                                    scrub: true,
                                }
                            });
                        }
                    });
                }
            });

            // 5. Mobile & Touch Animations (<=1366px OR touch)
            mm.add({
                isMobile: "(max-width: 1366px)",
                isDesktop: "(min-width: 1367px)"
            }, (context) => {
                let { isMobile, isDesktop } = context.conditions;
                
                if (isMobile || (isDesktop && isTouch)) {
                    // Premium Mobile Timeline Animation
                    const timelineItems = gsap.utils.toArray('.timeline-item');
                    timelineItems.forEach(item => {
                        const node = item.querySelector('.timeline-node');
                        const content = item.querySelector('.timeline-content');
                        
                        const tl = gsap.timeline({
                            scrollTrigger: {
                                trigger: item,
                                start: 'top 85%',
                                toggleActions: 'play reverse play reverse'
                            }
                        });
                        
                        if (node) {
                            tl.fromTo(node, 
                                { scale: 0, opacity: 0, rotation: -90 },
                                { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }
                            );
                        }
                        
                        if (content) {
                            tl.fromTo(content,
                                { y: 60, opacity: 0, rotationX: 15, transformPerspective: 1000 },
                                { y: 0, opacity: 1, rotationX: 0, duration: 0.7, ease: 'power4.out' },
                                "-=0.3"
                            );
                            
                            const innerTexts = content.querySelectorAll('h3, h4, .date, p, li, .badge');
                            if (innerTexts.length > 0) {
                                tl.fromTo(innerTexts,
                                    { y: 20, opacity: 0 },
                                    { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power2.out' },
                                    "-=0.5"
                                );
                            }
                        }
                    });

                    // Bespoke Mobile About Animation
                    const aboutElements = [
                        { sel: '.first-name', x: -80, y: 0, scale: 1 },
                        { sel: '.profile-wrapper', x: 0, y: 50, scale: 0.9 },
                        { sel: '.last-name', x: 80, y: 0, scale: 1 },
                        { sel: '.info-card', x: 0, y: 50, scale: 1 }
                    ];

                    aboutElements.forEach(config => {
                        gsap.utils.toArray(config.sel).forEach((el, index) => {
                            gsap.fromTo(el,
                                { x: config.x, y: config.y, scale: config.scale, opacity: 0 },
                                {
                                    scrollTrigger: {
                                        trigger: el,
                                        start: 'top 85%',
                                        toggleActions: 'play reverse play reverse'
                                    },
                                    x: 0, y: 0, scale: 1, opacity: 1, 
                                    duration: 1.0, 
                                    delay: config.sel === '.info-card' ? index * 0.15 : 0,
                                    ease: 'back.out(1.5)'
                                }
                            );
                        });
                    });

                    // Home section fade out on scroll
                    gsap.to('.hero-content', {
                        scrollTrigger: {
                            trigger: '#home',
                            start: 'top top',
                            end: 'bottom 50%',
                            scrub: true
                        },
                        y: -50,
                        opacity: 0,
                        ease: 'none'
                    });
                }
            });
    }

    // 6. Background Shapes Parallax & Random Scroll Movement
    const shapes = document.querySelectorAll('.floating-shapes .shape, .home-shapes .shape');
    if (shapes.length > 0 && typeof gsap !== 'undefined') {
        
        // Setup random scroll movement
        if (typeof ScrollTrigger !== 'undefined') {
            shapes.forEach((shape, index) => {
                const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
                
                // Randomize end positions for a chaotic, multidirectional feel
                // Alternating directions based on index to spread them out
                const randomX = (index % 2 === 0 ? 1 : -1) * (Math.random() * 300 + 100) * speed;
                const randomY = (index % 3 === 0 ? 1 : -1) * (Math.random() * 500 + 300) * speed;
                const randomRot = (Math.random() - 0.5) * 720 * speed;
                const randomScale = 1 + (Math.random() - 0.5) * 0.5;

                gsap.to(shape, {
                    x: randomX,
                    y: randomY,
                    rotation: randomRot,
                    scale: randomScale,
                    ease: "none",
                    scrollTrigger: {
                        trigger: document.documentElement,
                        start: "top top",
                        end: "max",
                        scrub: 1.5 // Smooth scrubbing
                    }
                });
            });
        }

        // Mouse Parallax (using independent translate property so it doesn't conflict with GSAP's transform)
        if (!isTouch) {
            let targetX = 0;
            let targetY = 0;
            let currentX = 0;
            let currentY = 0;

            window.addEventListener('mousemove', (e) => {
                targetX = (e.clientX - window.innerWidth / 2) * -0.05;
                targetY = (e.clientY - window.innerHeight / 2) * -0.05;
            });

            // Smooth interpolation loop for mouse parallax
            function updateMouseParallax() {
                currentX += (targetX - currentX) * 0.1;
                currentY += (targetY - currentY) * 0.1;

                shapes.forEach(shape => {
                    const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
                    const moveX = currentX * speed;
                    const moveY = currentY * speed;
                    // Using CSS translate property to keep it independent of GSAP transforms
                    shape.style.translate = `${moveX}px ${moveY}px`;
                });
                requestAnimationFrame(updateMouseParallax);
            }
            updateMouseParallax();
        }
    }
});

// Force ScrollTrigger to recalculate all positions after all images/fonts are fully loaded
// This is critical for Safari and iPad where slow image loading shifts the page height
window.addEventListener('load', () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);
    }
});
