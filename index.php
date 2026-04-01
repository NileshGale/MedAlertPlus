<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Med-Alert-Plus | Your Personal Health Assistant</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4A90E2;
            --primary-dark: #357ABD;
            --secondary: #50E3C2;
            --accent: #FF7E5F;
            --dark: #1A202C;
            --light: #F7FAFC;
            --white: #FFFFFF;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            color: var(--dark);
            line-height: 1.6;
            overflow-x: hidden;
            background: var(--light);
        }

        /* Navbar */
        nav {
            height: 90px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 8%;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            transition: 0.3s;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--primary);
            text-decoration: none;
        }

        .logo-icon {
            width: 45px;
            height: 45px;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(74, 144, 226, 0.2);
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 40px;
            align-items: center;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--dark);
            font-weight: 600;
            font-size: 1rem;
            transition: 0.3s;
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .btn-nav {
            background: var(--primary);
            color: white !important;
            padding: 12px 28px;
            border-radius: 50px;
            box-shadow: 0 10px 20px rgba(74, 144, 226, 0.2);
        }

        /* Hero Section */
        .hero {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 8%;
            background: radial-gradient(circle at 80% 20%, rgba(80, 227, 194, 0.1) 0%, transparent 40%),
                        radial-gradient(circle at 10% 80%, rgba(74, 144, 226, 0.1) 0%, transparent 40%);
            margin-top: 50px;
        }

        .hero-content {
            max-width: 600px;
        }

        .badge-hero {
            background: #EBF4FF;
            color: var(--primary);
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
            display: inline-block;
        }

        .hero-content h1 {
            font-size: 4rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 24px;
            color: #2D3748;
        }

        .hero-content h1 span {
            color: var(--primary);
        }

        .hero-content p {
            font-size: 1.25rem;
            color: #718096;
            margin-bottom: 40px;
        }

        .hero-btns {
            display: flex;
            gap: 20px;
        }

        .btn-main {
            padding: 18px 40px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            box-shadow: 0 15px 30px rgba(74, 144, 226, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-5px);
            background: var(--primary-dark);
        }

        .btn-outline {
            border: 2px solid #E2E8F0;
            color: var(--dark);
        }

        .btn-outline:hover {
            background: #E2E8F0;
        }

        .hero-stats {
            margin-top: 60px;
            display: flex;
            gap: 40px;
        }

        .stat-item h3 { font-size: 1.8rem; font-weight: 800; color: var(--dark); }
        .stat-item p { font-size: 0.95rem; color: #718096; }

        .hero-image {
            position: relative;
            flex: 1;
            display: flex;
            justify-content: flex-end;
        }

        .main-img-container {
            position: relative;
            z-index: 5;
        }

        .main-img-container img {
            max-width: 100%;
            border-radius: 30px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.1);
        }

        .floating-card {
            position: absolute;
            background: white;
            padding: 20px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            z-index: 10;
            animation: float 6s ease-in-out infinite;
        }

        .fc-1 { top: 10%; left: -10%; }
        .fc-2 { bottom: 15%; right: -5%; animation-delay: 2s; }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        /* Features Section */
        .features {
            padding: 100px 8%;
            text-align: center;
        }

        .section-header {
            max-width: 700px;
            margin: 0 auto 80px;
        }

        .section-header h2 { font-size: 2.8rem; font-weight: 800; margin-bottom: 20px; color: #2D3748; }
        .section-header p { font-size: 1.1rem; color: #718096; }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
        }

        .feature-card {
            background: white;
            padding: 50px 40px;
            border-radius: 30px;
            transition: 0.4s;
            text-align: left;
            position: relative;
            overflow: hidden;
            border: 1px solid #EDF2F7;
        }

        .feature-card:hover {
            transform: translateY(-15px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.06);
            border-color: var(--primary);
        }

        .feat-icon {
            width: 70px;
            height: 70px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin-bottom: 30px;
        }

        .fi-1 { background: #EBF4FF; color: var(--primary); }
        .fi-2 { background: #E6FFFA; color: var(--secondary); }
        .fi-3 { background: #FFF5F5; color: var(--accent); }

        .feature-card h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; }
        .feature-card p { color: #718096; margin-bottom: 25px; }

        .feature-card .learn-more {
            color: var(--primary);
            text-decoration: none;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Footer */
        footer {
            padding: 80px 8% 40px;
            background: white;
            border-top: 1px solid #EDF2F7;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
            gap: 60px;
            margin-bottom: 60px;
        }

        .footer-logo h2 { font-weight: 800; color: var(--primary); margin-bottom: 20px; }
        .footer-logo p { color: #718096; max-width: 300px; }

        .footer-col h4 { font-weight: 700; margin-bottom: 25px; font-size: 1.1rem; }
        .footer-col ul { list-style: none; }
        .footer-col ul li { margin-bottom: 15px; }
        .footer-col ul li a { text-decoration: none; color: #718096; transition: 0.3s; }
        .footer-col ul li a:hover { color: var(--primary); }

        .newsletter h4 { margin-bottom: 25px; }
        .newsletter p { margin-bottom: 20px; font-size: 0.9rem; color: #718096; }
        .news-input {
            display: flex;
            gap: 10px;
        }
        .news-input input {
            flex: 1;
            padding: 12px 15px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
            outline: none;
        }
        .news-input .btn { padding: 12px 20px; border-radius: 10px; background: var(--primary); color: white; border: none; cursor: pointer; }

        .footer-bottom {
            border-top: 1px solid #EDF2F7;
            padding-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #A0AEC0;
            font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .hero-content h1 { font-size: 3.2rem; }
            .hero-image { display: none; }
        }

        @media (max-width: 768px) {
            nav { padding: 0 5%; }
            .nav-links { display: none; }
            .hero { padding: 0 5%; text-align: center; justify-content: center; }
            .hero-btns { justify-content: center; }
            .hero-stats { justify-content: center; }
            .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
    </style>
</head>
<body>

    <nav>
        <a href="index.php" class="logo">
            <div class="logo-icon"><i class="fas fa-notes-medical"></i></div>
            <span>Med-Alert-Plus</span>
        </a>
        <ul class="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#doctors">Doctors</a></li>
            <li><a href="login.php">Login</a></li>
            <li><a href="register.php" class="btn-nav">Get Started</a></li>
        </ul>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <span class="badge-hero">New: AI Symptom Diagnosis Integrated</span>
            <h1>Revolutionizing <span>Personal Health</span> Management.</h1>
            <p>Your all-in-one platform for medical reminders, symptom checking, and effortless clinical appointments. Stay ahead of your health with Med-Alert-Plus.</p>
            
            <div class="hero-btns">
                <a href="register.php" class="btn-main btn-primary">Start Your Health Journey <i class="fas fa-arrow-right"></i></a>
                <a href="login.php" class="btn-main btn-outline">Explore Dashboard</a>
            </div>

            <div class="hero-stats">
                <div class="stat-item">
                    <h3>10k+</h3>
                    <p>Active Users</p>
                </div>
                <div class="stat-item">
                    <h3>500+</h3>
                    <p>Top Doctors</p>
                </div>
                <div class="stat-item">
                    <h3>99.9%</h3>
                    <p>Alert Accuracy</p>
                </div>
            </div>
        </div>

        <div class="hero-image">
            <div class="main-img-container">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600" alt="Med-Alert Dashboard">
            </div>
            
            <div class="floating-card fc-1">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div style="width:40px;height:40px;background:#EBF4FF;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--primary)"><i class="fas fa-check"></i></div>
                    <div>
                        <p style="font-size:0.8rem;color:#718096;margin:0">Medicine Taken</p>
                        <p style="font-weight:700;font-size:0.95rem;margin:0">Paracetamol 500mg</p>
                    </div>
                </div>
            </div>

            <div class="floating-card fc-2">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div style="width:40px;height:40px;background:#E6FFFA;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--secondary)"><i class="fas fa-heartbeat"></i></div>
                    <div>
                        <p style="font-size:0.8rem;color:#718096;margin:0">Health Status</p>
                        <p style="font-weight:700;font-size:0.95rem;margin:0">Normal - 72 BPM</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="features" id="features">
        <div class="section-header">
            <h2>Everything you need for a healthier life.</h2>
            <p>Our platform combines cutting-edge AI with human expertise to provide you with the most comprehensive health management tool available today.</p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feat-icon fi-1"><i class="fas fa-robot"></i></div>
                <h3>AI Symptom Checker</h3>
                <p>Describe your symptoms in plain language and our AI engine will provide instant analysis and next steps.</p>
                <a href="register.php" class="learn-more">Try AI Checker <i class="fas fa-chevron-right"></i></a>
            </div>

            <div class="feature-card">
                <div class="feat-icon fi-2"><i class="fas fa-bell"></i></div>
                <h3>Smart Reminders</h3>
                <p>Never miss a dose again. Get personalized medicine reminders via email (daily summary at your time) directly to your inbox.</p>
                <a href="register.php" class="learn-more">Set Reminders <i class="fas fa-chevron-right"></i></a>
            </div>

            <div class="feature-card">
                <div class="feat-icon fi-3"><i class="fas fa-calendar-check"></i></div>
                <h3>Instant Booking</h3>
                <p>Find nearby specialized clinics and book physical or virtual assessment appointments in just a few clicks.</p>
                <a href="register.php" class="learn-more">Find Clinics <i class="fas fa-chevron-right"></i></a>
            </div>
        </div>
    </section>

    <footer>
        <div class="footer-grid">
            <div class="footer-logo">
                <h2>Med-Alert-Plus</h2>
                <p>Your modern partner in health management. Secure, smart, and designed for you.</p>
            </div>
            <div class="footer-col">
                <h4>Platform</h4>
                <ul>
                    <li><a href="#">AI Diagnostics</a></li>
                    <li><a href="#">Clinic Locator</a></li>
                    <li><a href="#">Medicine Reminders</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Contact Support</a></li>
                </ul>
            </div>
            <div class="newsletter">
                <h4>Stay Updated</h4>
                <p>Subscribe to our health insights newsletter.</p>
                <div class="news-input">
                    <input type="email" placeholder="Your email">
                    <button class="btn">Join</button>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Med-Alert-Plus. All rights reserved.</p>
            <div style="display:flex; gap:20px;">
                <a href="#" style="color:#A0AEC0"><i class="fab fa-twitter"></i></a>
                <a href="#" style="color:#A0AEC0"><i class="fab fa-facebook"></i></a>
                <a href="#" style="color:#A0AEC0"><i class="fab fa-linkedin"></i></a>
            </div>
        </div>
    </footer>

</body>
</html>
