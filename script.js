/* ============================================
   THREE.JS 3D SCENE – Floating Geometry & Particles
   ============================================ */
const threeCanvas = document.getElementById("three-canvas");
let scene, camera, renderer, geometries = [], particleSystem;
let scrollY = 0;

function init3DScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Create wireframe materials with glow
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.15 }),
    new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.12 }),
    new THREE.MeshBasicMaterial({ color: 0x64ffda, wireframe: true, transparent: true, opacity: 0.10 }),
    new THREE.MeshBasicMaterial({ color: 0xf472b6, wireframe: true, transparent: true, opacity: 0.08 }),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.12 }),
  ];

  // --- Floating Wireframe Geometries ---
  const geoConfigs = [
    { geo: new THREE.TorusGeometry(3, 1, 16, 50), pos: [-12, 8, -15], speed: 0.003, rotAxis: 'xy' },
    { geo: new THREE.OctahedronGeometry(2.5), pos: [14, -5, -10], speed: 0.005, rotAxis: 'xz' },
    { geo: new THREE.IcosahedronGeometry(2, 0), pos: [-8, -10, -8], speed: 0.004, rotAxis: 'yz' },
    { geo: new THREE.TorusKnotGeometry(2, 0.6, 100, 16), pos: [10, 10, -20], speed: 0.002, rotAxis: 'xy' },
    { geo: new THREE.DodecahedronGeometry(1.8), pos: [0, -15, -12], speed: 0.006, rotAxis: 'xz' },
    { geo: new THREE.TetrahedronGeometry(2.2), pos: [-15, 0, -18], speed: 0.0035, rotAxis: 'yz' },
    { geo: new THREE.RingGeometry(1.5, 3, 32), pos: [18, 5, -25], speed: 0.004, rotAxis: 'xy' },
    { geo: new THREE.TorusGeometry(1.5, 0.5, 12, 30), pos: [-5, 15, -14], speed: 0.003, rotAxis: 'xz' },
  ];

  geoConfigs.forEach((config, i) => {
    const mesh = new THREE.Mesh(config.geo, materials[i % materials.length]);
    mesh.position.set(...config.pos);
    mesh.userData = {
      speed: config.speed,
      rotAxis: config.rotAxis,
      originalPos: [...config.pos],
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
      floatAmplitude: 1 + Math.random() * 2,
    };
    scene.add(mesh);
    geometries.push(mesh);
  });

  // --- 3D Particle Field ---
  const particleCount = 500;
  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color(0x00d4ff),
    new THREE.Color(0x7c3aed),
    new THREE.Color(0x64ffda),
    new THREE.Color(0xf472b6),
  ];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particleSystem = new THREE.Points(particlesGeo, particleMaterial);
  scene.add(particleSystem);

  // --- Connecting Lines (constellation effect) ---
  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
  });

  const linesGeo = new THREE.BufferGeometry();
  const linePositions = [];
  for (let i = 0; i < 80; i++) {
    const idx1 = Math.floor(Math.random() * particleCount);
    const idx2 = Math.floor(Math.random() * particleCount);
    linePositions.push(
      positions[idx1 * 3], positions[idx1 * 3 + 1], positions[idx1 * 3 + 2],
      positions[idx2 * 3], positions[idx2 * 3 + 1], positions[idx2 * 3 + 2]
    );
  }
  linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const linesMesh = new THREE.LineSegments(linesGeo, linesMaterial);
  scene.add(linesMesh);

  // Handle resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Mouse tracking for 3D interaction
let mouse3D = { x: 0, y: 0 };
document.addEventListener("mousemove", (e) => {
  mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse3D.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
function animate3D() {
  requestAnimationFrame(animate3D);

  const time = Date.now() * 0.001;

  // Animate geometries
  geometries.forEach((mesh) => {
    const { speed, rotAxis, floatOffset, floatSpeed, floatAmplitude, originalPos } = mesh.userData;

    // Rotation
    if (rotAxis.includes('x')) mesh.rotation.x += speed;
    if (rotAxis.includes('y')) mesh.rotation.y += speed;
    if (rotAxis.includes('z')) mesh.rotation.z += speed * 0.7;

    // Floating motion
    mesh.position.y = originalPos[1] + Math.sin(time * floatSpeed + floatOffset) * floatAmplitude;
    mesh.position.x = originalPos[0] + Math.cos(time * floatSpeed * 0.5 + floatOffset) * floatAmplitude * 0.5;
  });

  // Mouse-reactive camera
  camera.position.x += (mouse3D.x * 3 - camera.position.x) * 0.02;
  camera.position.y += (mouse3D.y * 2 - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  // Scroll-based parallax for 3D scene
  const scrollFactor = scrollY * 0.003;
  camera.position.z = 30 + scrollFactor * 5;

  // Animate particles
  if (particleSystem) {
    particleSystem.rotation.y = time * 0.02;
    particleSystem.rotation.x = time * 0.01;
  }

  renderer.render(scene, camera);
}

// Initialize 3D scene
if (typeof THREE !== 'undefined' && threeCanvas) {
  init3DScene();
  animate3D();
}

/* ============================================
   DOM REFERENCES
   ============================================ */
const header = document.querySelector(".header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-link");
const typedText = document.getElementById("typed-text");
const revealElements = document.querySelectorAll(".reveal");
const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");
const footerYear = document.getElementById("footer-year");
const scrollProgress = document.getElementById("scroll-progress");
const cursorGlow = document.getElementById("cursor-glow");
const backToTop = document.getElementById("back-to-top");

const sectionTargets = Array.from(navItems)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

/* ============================================
   CURSOR GLOW EFFECT
   ============================================ */
let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateGlow() {
  // Smooth follow with lerp
  glowX += (mouseX - glowX) * 0.08;
  glowY += (mouseY - glowY) * 0.08;
  
  if (cursorGlow) {
    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;
  }
  requestAnimationFrame(animateGlow);
}
animateGlow();

/* ============================================
   SPOTLIGHT CARD EFFECT
   ============================================ */
const spotlightCards = document.querySelectorAll(".spotlight-card");
spotlightCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--spotlight-x", `${x}px`);
    card.style.setProperty("--spotlight-y", `${y}px`);
  });
});

/* ============================================
   3D TILT EFFECT – All .tilt-3d cards
   ============================================ */
const tilt3DCards = document.querySelectorAll(".tilt-3d");
const isTouchDevice = window.matchMedia("(hover: none)").matches;

if (!isTouchDevice) {
  tilt3DCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const maxTilt = 12;
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      // Dynamic shadow based on tilt direction
      const shadowX = rotateY * 1.5;
      const shadowY = -rotateX * 1.5;

      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.boxShadow = `
        ${shadowX}px ${shadowY + 20}px 60px -12px rgba(0, 0, 0, 0.5),
        ${shadowX * 0.5}px ${shadowY * 0.5}px 40px rgba(0, 212, 255, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.06)
      `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      card.style.boxShadow = "";
    });
  });
}



/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */
function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) {
    scrollProgress.style.width = `${progress}%`;
  }
}

/* ============================================
   BACK TO TOP BUTTON
   ============================================ */
function updateBackToTop() {
  if (backToTop) {
    if (window.scrollY > 400) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  }
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ============================================
   TYPING EFFECT – Multiple phrases
   ============================================ */
const typingPhrases = [
  "Full Stack Developer",
  "CSE Student @ Chandigarh University",
  "IoT Enthusiast",
  "Building the Future, One Commit at a Time"
];

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function typeEffect() {
  const currentPhrase = typingPhrases[phraseIndex];

  if (!deleting) {
    charIndex += 1;
    typedText.textContent = currentPhrase.slice(0, charIndex);

    if (charIndex === currentPhrase.length) {
      deleting = true;
      setTimeout(typeEffect, 2200);
      return;
    }
  } else {
    charIndex -= 1;
    typedText.textContent = currentPhrase.slice(0, charIndex);

    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % typingPhrases.length;
    }
  }

  const speed = deleting ? 30 : 65;
  setTimeout(typeEffect, speed);
}

/* ============================================
   NAVIGATION
   ============================================ */
function toggleMenu() {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeMenu() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function smoothScroll(event) {
  const targetId = event.currentTarget.getAttribute("href");

  if (!targetId || !targetId.startsWith("#")) {
    return;
  }

  const targetElement = document.querySelector(targetId);
  if (!targetElement) {
    return;
  }

  event.preventDefault();
  targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveNavLink(targetId.slice(1));
  closeMenu();
}

function setActiveNavLink(activeId) {
  navItems.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/* ============================================
   STICKY HEADER
   ============================================ */
function applyStickyEffect() {
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

/* ============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================ */
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

/* ============================================
   ACTIVE SECTION TRACKING
   ============================================ */
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.id) {
        setActiveNavLink(entry.target.id);
      }
    });
  },
  {
    root: null,
    threshold: 0.2,
    rootMargin: "-35% 0px -55% 0px"
  }
);

sectionTargets.forEach((section) => navObserver.observe(section));

/* ============================================
   STAGGERED SKILL CARD ANIMATION
   ============================================ */
const skillCards = document.querySelectorAll(".skill-card");
const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const cards = document.querySelectorAll(".skill-card");
        cards.forEach((card, i) => {
          card.style.transitionDelay = `${i * 80}ms`;
          card.style.opacity = "1";
          card.style.transform = "translateY(0) perspective(1200px) rotateX(0deg)";
        });
        skillObserver.disconnect();
      }
    });
  },
  { threshold: 0.1 }
);

const skillsSection = document.getElementById("skills");
if (skillsSection) {
  skillCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px) perspective(1200px) rotateX(15deg)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s ease, box-shadow 0.3s ease";
  });
  skillObserver.observe(skillsSection);
}



/* ============================================
   CONTACT FORM
   ============================================ */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = contactForm.name.value.trim();
  const email = contactForm.email.value.trim();
  const message = contactForm.message.value.trim();
  const honey = contactForm.querySelector('input[name="_honey"]')?.value.trim();

  if (!name || !email || !message) {
    formMessage.textContent = "> Error: All fields are required.";
    formMessage.classList.remove("success");
    return;
  }

  if (!validateEmail(email)) {
    formMessage.textContent = "> Error: Invalid email format.";
    formMessage.classList.remove("success");
    return;
  }

  if (message.length < 10) {
    formMessage.textContent = "> Error: Message too short (min 10 chars).";
    formMessage.classList.remove("success");
    return;
  }

  if (honey) {
    formMessage.textContent = "> Spam detected. Blocked.";
    formMessage.classList.remove("success");
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "⏳ Sending...";
  formMessage.textContent = "> Executing send()...";
  formMessage.classList.remove("success");

  try {
    const response = await fetch("https://formsubmit.co/ajax/krishnagopal102006@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject: "New Portfolio Contact Message",
        _template: "table"
      })
    });

    if (!response.ok) {
      throw new Error("Submission failed.");
    }

    formMessage.textContent = "> ✓ Message sent successfully!";
    formMessage.classList.add("success");
    contactForm.reset();
  } catch (error) {
    formMessage.textContent = "> ✗ Failed to send. Try again later.";
    formMessage.classList.remove("success");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<span class="btn-icon">⚡</span> Execute send()';
  }
});

/* ============================================
   MAGNETIC BUTTON EFFECT
   ============================================ */
const magneticBtns = document.querySelectorAll(".magnetic");
magneticBtns.forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) translateZ(5px)`;
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translate(0, 0) translateZ(0)";
  });
});

/* ============================================
   FOOTER YEAR
   ============================================ */
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

/* ============================================
   COMBINED SCROLL HANDLER
   ============================================ */
function onScroll() {
  scrollY = window.scrollY;
  applyStickyEffect();
  updateScrollProgress();
  updateBackToTop();
}

/* ============================================
   INITIALIZE
   ============================================ */
menuToggle.addEventListener("click", toggleMenu);
navItems.forEach((link) => link.addEventListener("click", smoothScroll));
window.addEventListener("scroll", onScroll, { passive: true });

onScroll();
setActiveNavLink((window.location.hash || "#home").slice(1));
typeEffect();

/* ============================================
   CLOSE NAV ON OUTSIDE CLICK
   ============================================ */
document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
    closeMenu();
  }
});

/* ============================================
   SMOOTH PAGE LOAD
   ============================================ */
window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});
