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
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% of the section is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navItems.forEach(a => {
                    a.classList.remove('active');
                    if (a.getAttribute('href') === `#${currentId}`) {
                        a.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(sec => {
        observer.observe(sec);
    });

    // 4. Hero Animated Text (Rotating words)
    const words = document.querySelectorAll('.animated-words .word');
    if (words.length > 0) {
        let currentWordIndex = 0;
        setInterval(() => {
            words[currentWordIndex].classList.add('hidden');
            currentWordIndex = (currentWordIndex + 1) % words.length;
            words[currentWordIndex].classList.remove('hidden');
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
            const sections = document.querySelectorAll('.scroll-section');
            
            sections.forEach((sec, i) => {
                ScrollTrigger.create({
                    trigger: sec,
                    start: 'top center',
                    end: 'bottom center',
                    onToggle: self => {
                        if (self.isActive && dots[i]) {
                            dots.forEach(d => d.classList.remove('active'));
                            dots[i].classList.add('active');
                        }
                    }
                });
            });

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

            // -- Hero Cinematic Scroll Reveal --
            // Pin the hero and fade out elements (desktop only)
            if (window.innerWidth > 1366 && !isTouch) {
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
            }

            // -- About Section Parallax Storytelling --
            if (window.innerWidth > 1366 && !isTouch) {
                const aboutTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#about',
                        start: 'top top',
                        end: '+=200%', // Increased distance so the pause is longer
                        scrub: 1,
                        pin: true
                    }
                });
                aboutTl.from('.first-name', { x: -200, opacity: 0, duration: 1 })
                       .from('.profile-wrapper', { scale: 0.5, opacity: 0, duration: 1 }, "-=0.5")
                       .from('.last-name', { x: 200, opacity: 0, duration: 1 }, "-=0.5")
                       .from('.info-card', { y: 80, opacity: 0, stagger: 0.2, duration: 1 }, "-=0.3")
                       .to({}, { duration: 3 }); // Tripled the pause duration at the end
            }

            // -- Experience & Education Timeline Scroll Progress --
            // Using vanilla scroll listener instead of GSAP ScrollTrigger
            // because pin-spacers from pinned sections corrupt ScrollTrigger's position calculations.
            const allTimelines = document.querySelectorAll('.timeline');
            
            function updateTimelineProgress() {
                allTimelines.forEach(timeline => {
                    const progress = timeline.querySelector('.timeline-progress');
                    if (!progress) return;
                    
                    const rect = timeline.getBoundingClientRect();
                    const viewportCenter = window.innerHeight / 2;
                    
                    // Calculate how far the viewport center has traveled through the timeline
                    // When top of timeline = viewport center → 0%
                    // When bottom of timeline = viewport center → 100%
                    const timelineHeight = rect.height;
                    const distanceFromTop = viewportCenter - rect.top;
                    
                    let pct = distanceFromTop / timelineHeight;
                    pct = Math.max(0, Math.min(1, pct)); // Clamp between 0 and 1
                    
                    progress.style.transform = `scaleY(${pct})`;
                });
                
                requestAnimationFrame(updateTimelineProgress);
            }
            
            updateTimelineProgress();

            if (window.innerWidth > 768 && !isTouch) {

                gsap.utils.toArray('.timeline-step').forEach((step, i) => {
                    gsap.from(step, {
                        scrollTrigger: {
                            trigger: step,
                            start: 'top 80%',
                            end: 'top 30%',
                            scrub: 1,
                        },
                        x: i % 2 === 0 ? -100 : 100,
                        opacity: 0,
                        rotateY: i % 2 === 0 ? -15 : 15,
                    });
                });
            }

            // -- Education & Experience Scroll Steps are handled by the .timeline-step loop above --

            // -- Portfolio Horizontal Scroll --
            if (window.innerWidth > 1366 && !isTouch) {
                const track = document.querySelector(".horizontal-track");
                const slides = gsap.utils.toArray(".h-slide");
                
                if (track && slides.length > 0) {
                    // Slides are 50vw wide, so multiply by 50 instead of 100
                    const totalWidth = slides.length * 50;
                    track.style.width = `${totalWidth}vw`;

                    const horizontalScroll = gsap.to(track, {
                        x: () => -track.scrollWidth, // Pushes the track exactly off the left edge
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".portfolio-section",
                            start: "top top",
                            end: () => `+=${track.scrollWidth}`, // Match exactly the distance translated
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
            }

            // -- Unified Mobile & Touch Animations (Fallback for Safari/iOS) --
            // Safari doesn't support CSS animation-timeline, and on mobile we disable complex pinning.
            // This ensures smooth fade-in animations as the user scrolls down on iPad/mobile.
            if (window.innerWidth <= 1366 || isTouch) {
                const animateElements = gsap.utils.toArray('.scroll-animate-up, .scroll-animate-left, .scroll-animate-right, .gallery-item, .timeline-content');
                animateElements.forEach(el => {
                    let xOffset = 0;
                    let yOffset = 50;
                    if (el.classList.contains('scroll-animate-left') || el.closest('.timeline-item.left')) xOffset = -50;
                    if (el.classList.contains('scroll-animate-right') || el.closest('.timeline-item.right')) xOffset = 50;

                    gsap.from(el, {
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 95%', // Start fading in when it enters the bottom 5% of screen
                            end: 'center 70%', // Finish fading in when it reaches 70% from the top
                            scrub: true // Tie animation directly to scroll position, foolproof!
                        },
                        x: xOffset,
                        y: xOffset === 0 ? yOffset : 0,
                        opacity: 0,
                        ease: 'none' // Scrubbing looks better with linear easing
                    });
                });

                // Home section fade out on scroll (without pinning)
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
    }

    // 6. Premium 3D WebGL Background (Three.js) - Scroll-Driven Crystal
    const container = document.getElementById('webgl-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x07090F, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const light1 = new THREE.PointLight(0xFF5E20, 2, 100);
        const light2 = new THREE.PointLight(0xE02828, 2, 100);
        const light3 = new THREE.PointLight(0x56EAC6, 2, 100);
        scene.add(light1);
        scene.add(light2);
        scene.add(light3);

        let detail = window.innerWidth < 768 ? 1 : 2; 
        const geometry = new THREE.IcosahedronGeometry(12, detail);
        
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x0B0E17,
            metalness: 0.1,
            roughness: 0.0,
            transmission: 0.95,
            thickness: 5,
            ior: 2.4,
            clearcoat: 1.0,
            envMapIntensity: 1.5,
            side: THREE.DoubleSide
        });

        const crystal = new THREE.Mesh(geometry, material);
        scene.add(crystal);
        
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 200;
        const posArray = new Float32Array(particlesCount * 3);
        const velArray = [];
        
        for(let i=0; i < particlesCount * 3; i+=3) {
            posArray[i] = 0;
            posArray[i+1] = 0;
            posArray[i+2] = 0;
            
            velArray.push({
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 2
            });
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.5,
            color: 0xFF5E20,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let scrollProgress = 0;

        let bgMouseX = 0;
        let bgMouseY = 0;
        let bgScrollY = window.scrollY;

        window.addEventListener('mousemove', (event) => {
            // Keep the WebGL mouse tracking
            mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
            mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
            
            // Background shapes mouse tracking
            bgMouseX = event.clientX - window.innerWidth / 2;
            bgMouseY = event.clientY - window.innerHeight / 2;
        });

        window.addEventListener('scroll', () => {
            bgScrollY = window.scrollY;
        });

        function updateBackgroundShapes() {
            const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
            const scrollProgress = window.scrollY / maxScroll;
            // Center the progress (-0.5 to 0.5) so shapes hover around their original CSS position
            const centeredProgress = scrollProgress - 0.5;

            document.querySelectorAll('.floating-shapes .shape').forEach(shape => {
                const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
                const x = (bgMouseX * speed * -0.05);
                const y = (bgMouseY * speed * -0.05) + (centeredProgress * speed * -500);
                shape.style.translate = `${x}px ${y}px`;
            });

            // Home shapes (position: absolute, scrolls naturally, only needs mouse parallax + slight scroll)
            document.querySelectorAll('.home-shapes .shape').forEach(shape => {
                const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
                const x = (bgMouseX * speed * -0.05);
                // Just a slight parallax against scrollY since it starts at 0 here
                const y = (bgMouseY * speed * -0.05) + (window.scrollY * speed * -0.1);
                shape.style.translate = `${x}px ${y}px`;
            });
            requestAnimationFrame(updateBackgroundShapes);
        }
        updateBackgroundShapes();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        window.addEventListener('scroll', () => {
            scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        });

        const clock = new THREE.Clock();
        let exploded = false;
        
        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            crystal.rotation.y = time * 0.2 + scrollProgress * Math.PI * 4;
            crystal.rotation.x = time * 0.1 + scrollProgress * Math.PI * 2;
            
            if (window.innerWidth > 768) {
                if (scrollProgress < 0.15) {
                    crystal.position.set(0, 0, 0);
                    crystal.scale.setScalar(1);
                    material.color.setHex(0x0B0E17);
                } else if (scrollProgress < 0.35) {
                    const p = (scrollProgress - 0.15) / 0.2;
                    crystal.position.set(gsap.utils.interpolate(0, -15, p), gsap.utils.interpolate(0, 5, p), 0);
                    crystal.scale.setScalar(gsap.utils.interpolate(1, 0.6, p));
                    material.color.setHex(0xFF5E20);
                } else if (scrollProgress < 0.6) {
                    const p = (scrollProgress - 0.35) / 0.25;
                    crystal.position.set(gsap.utils.interpolate(-15, 15, p), gsap.utils.interpolate(5, -5, p), 0);
                    crystal.scale.setScalar(0.6);
                    material.color.setHex(0xE02828);
                } else if (scrollProgress < 0.75) {
                    const p = (scrollProgress - 0.6) / 0.15;
                    crystal.position.set(gsap.utils.interpolate(15, -10, p), gsap.utils.interpolate(-5, -5, p), 0);
                    crystal.scale.setScalar(gsap.utils.interpolate(0.6, 0.4, p));
                    material.color.setHex(0x56EAC6);
                } else if (scrollProgress < 0.9) {
                    const p = (scrollProgress - 0.75) / 0.15;
                    crystal.position.set(gsap.utils.interpolate(-10, 0, p), gsap.utils.interpolate(-5, 0, p), 0);
                    crystal.scale.setScalar(gsap.utils.interpolate(0.4, 0.8, p));
                    material.color.setHex(0x0B0E17); 
                    crystal.scale.multiplyScalar(1 + Math.sin(time * 5) * 0.05);
                }
            } else {
                crystal.position.set(0, 0, 0);
                crystal.scale.setScalar(1);
            }

            if (scrollProgress > 0.9 && !exploded) {
                exploded = true;
                gsap.to(crystal.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "back.in(1.7)" });
                gsap.to(particlesMaterial, { opacity: 1, duration: 0.2 });
            } else if (scrollProgress <= 0.9 && exploded) {
                exploded = false;
                gsap.to(crystal.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 0.8, ease: "elastic.out(1, 0.3)" });
                gsap.to(particlesMaterial, { opacity: 0, duration: 0.5 });
                
                const positions = particles.geometry.attributes.position.array;
                for(let i=0; i < positions.length; i++) {
                    positions[i] = crystal.position.toArray()[i%3];
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }

            if (exploded) {
                const positions = particles.geometry.attributes.position.array;
                for(let i=0; i < particlesCount; i++) {
                    const i3 = i * 3;
                    positions[i3] += velArray[i].x * 0.5;
                    positions[i3+1] += velArray[i].y * 0.5;
                    positions[i3+2] += velArray[i].z * 0.5;
                }
                particles.geometry.attributes.position.needsUpdate = true;
                particles.rotation.y = time * 0.1;
            } else {
                const positions = particles.geometry.attributes.position.array;
                for(let i=0; i < particlesCount * 3; i+=3) {
                    positions[i] = crystal.position.x;
                    positions[i+1] = crystal.position.y;
                    positions[i+2] = crystal.position.z;
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            light1.position.x = Math.sin(time * 0.5) * 15;
            light1.position.z = Math.cos(time * 0.5) * 15;
            light2.position.y = Math.sin(time * 0.7) * 15;
            light2.position.z = Math.cos(time * 0.7) * 15;
            light3.position.x = Math.sin(time * 0.3) * -15;
            light3.position.y = Math.cos(time * 0.3) * -15;

            renderer.render(scene, camera);
        };
        
        animate();
    }
});
