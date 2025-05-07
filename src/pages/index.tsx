import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Load the script from the static HTML
    const script = document.createElement('script');
    script.innerHTML = `
      document.addEventListener('DOMContentLoaded', function() {
        // FAQ Toggles
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                item.classList.toggle('active');
                const icon = item.querySelector('.faq-toggle i');
                if (item.classList.contains('active')) {
                    icon.classList.remove('fa-plus');
                    icon.classList.add('fa-minus');
                } else {
                    icon.classList.remove('fa-minus');
                    icon.classList.add('fa-plus');
                }
            });
        });

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
      });
    `;
    document.body.appendChild(script);

    // Clean up function
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="rtl-container">
      <Head>
        <title>وسيط - تطبيقك الذكي</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
        <meta name="description" content="وسيط - خدمة تبادل آمنة ومباشرة بين العملات الرقمية والليرة السورية بعمولة منخفضة" />
        <meta name="keywords" content="وسيط, عملات رقمية, ليرة سورية, تبادل عملات, USDT, تداول, سوريا" />
        <meta name="author" content="وسيط" />
        <meta property="og:title" content="وسيط - تطبيقك الذكي" />
        <meta property="og:description" content="خدمة تبادل آمنة ومباشرة بين العملات الرقمية والليرة السورية بعمولة منخفضة" />
        <meta property="og:image" content="/assets/images/waseet.png" />
        <meta property="og:url" content="https://waset.online" />
        <link rel="icon" type="image/png" href="/assets/images/waseet.png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Header */}
      <header>
        <nav>
          <a href="/" className="logo">
            <img src="/assets/images/waseet.png" alt="وسيط" className="logo-img" />
            <img src="/assets/images/Flag_of_Syria_(2025-).svg.png" alt="علم سوريا" className="flag-img" />
          </a>
          <div className="menu-toggle">
            <i className="fas fa-bars"></i>
          </div>
          <div className="nav-links">
            <a href="/">الصفة الرئيسية</a>
            <a href="/pages/guide">الشراء والبيع</a>
            <a href="/pages/about">من نحن</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1 style={{ marginBottom: '2.5rem', lineHeight: '1.6', padding: '0 0.5rem' }}>
            التطبيق الأول في سوريا<br />لشراء وبيع USDT
          </h1>
          <h2 style={{ marginTop: '1.5rem' }}>اشترِ وقم ببيع USDT بالمبلغ الذي تختاره وبسهولة</h2>
          
          <div className="hero-features">
            <div className="feature-point">
              <i className="fas fa-check-circle"></i>
              <p>عمولة 0%</p>
            </div>
            <div className="feature-point">
              <i className="fas fa-check-circle"></i>
              <p>سعر صرف مباشر وفق السوق المحلي</p>
            </div>
            <div className="feature-point">
              <i className="fas fa-check-circle"></i>
              <p>دعم فني متوفر على مدار الساعة لمساعدتك في أي خطوة</p>
            </div>
          </div>
          
          <div className="button-container">
            <a href="#download" className="button button-large">
              <i className="fas fa-download"></i>
              حمّل التطبيق الآن
            </a>
          </div>
        </div>
      </section>

      {/* Phone Animation Section */}
      <section className="phone-animation-section" id="app-preview" style={{ marginTop: '4rem', paddingTop: '2rem' }}>
        <div className="container">
          <div className="phone-container" style={{ marginTop: '2rem' }}>
            <div className="phone-wrapper">
              <div className="phone-image">
                <div className="phone-frame">
                  <img src="/assets/images/first-page.png" alt="تطبيق وسيط" className="app-screenshot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="page-section features-section" id="features">
        <div className="container">
          <div className="section-title">
            <h2>مميزات التطبيق</h2>
          </div>
          <div className="features">
            <div className="card">
              <i className="fas fa-exchange-alt card-icon"></i>
              <h3 className="card-title">معاملات سريعة</h3>
              <p className="card-text">شراء وبيع USDT مقابل الليرة السورية بسرعة وبدون عمولة (0%)</p>
            </div>
            <div className="card">
              <i className="fas fa-shield-alt card-icon"></i>
              <h3 className="card-title">أمان في المعاملات</h3>
              <p className="card-text">نضمن أمان عمليات الشراء والبيع ضمن بيئة موثوقة</p>
            </div>
            <div className="card">
              <i className="fas fa-tachometer-alt card-icon"></i>
              <h3 className="card-title">أسعار مباشرة</h3>
              <p className="card-text">أسعار صرف محدثة لحظة بلحظة لضمان أفضل قيمة لعملاتك</p>
            </div>
          </div>
        </div>
      </section>

      {/* WASIT Pitch Section */}
      <section className="page-section wasit-pitch-section" id="wasit-pitch">
        <div className="container">
          <div className="wasit-pitch-content">
            <div className="wasit-pitch-image">
              <img src="/assets/images/waseet.png" alt="تطبيق وسيط" className="wasit-app-preview" />
            </div>
            <div className="wasit-pitch-text">
              <h2>وسيط – حلك الآمن لتداول USDT</h2>
              <p>
                نحرص على تقديم تجربة مالية شفافة وواضحة، حيث يتم تحديث سعر الصرف بشكل مباشر ليعكس سعر السوق.
                كل معاملة يتم توثيقها ومراجعتها يدويًا من قبل فريق مختص. نحن ملتزمون بتنفيذ العمليات بأعلى درجات الموثوقية والدقة.
              </p>
              <div className="wasit-pitch-cta">
                <a href="/pages/guide" className="discover-link">
                  اكتشف الطريقة <i className="fas fa-arrow-left"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="page-section download-section" id="download">
        <div className="container">
          <div className="download-content">
            <h2>حمّل التطبيق الآن</h2>
            <p>استمتع بتجربة شراء وبيع USDT مع تطبيق وسيط.</p>
            <a 
              href="https://github.com/WASET-SY/mobile/releases/latest/download/production-release.apk" 
              className="button button-large" 
              download
            >
              <i className="fas fa-download"></i>
              جربه الآن
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="page-section faq-section" id="faq">
        <div className="container">
          <div className="faq-layout">
            <div className="faq-title">
              <h2>الأسئلة الشائعة</h2>
            </div>
            <div className="faq-container">
              <div className="faq-item">
                <div className="faq-question">
                  <h3>ما هي منصة WASET؟</h3>
                  <span className="faq-toggle"><i className="fas fa-plus"></i></span>
                </div>
                <div className="faq-answer">
                  <p>WASET.online هي أول منصة رقمية رسمية في سوريا مخصصة لشراء وبيع USDT بطريقة آمنة، مباشرة، وموثوقة.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>هل أستطيع تخزين USDT في التطبيق؟</h3>
                  <span className="faq-toggle"><i className="fas fa-plus"></i></span>
                </div>
                <div className="faq-answer">
                  <p>حالياً، التطبيق لا يدعم ميزة التخزين، وهو مخصص فقط لشراء وبيع USDT باستخدام محفظتك الخاصة.</p>
                  <p>نعمل على تطوير ميزات إضافية في المستقبل، وقد تشمل إمكانية التخزين داخل التطبيق.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>هل التطبيق متاح على جميع الأجهزة؟</h3>
                  <span className="faq-toggle"><i className="fas fa-plus"></i></span>
                </div>
                <div className="faq-answer">
                  <p>حالياً، التطبيق متاح فقط لأجهزة Android، ويمكن تحميله مباشرة من خلال هذا الموقع.</p>
                  <p>نعمل على توفير نسخة لأجهزة iOS في المستقبل القريب.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>هل الأسعار ثابتة؟</h3>
                  <span className="faq-toggle"><i className="fas fa-plus"></i></span>
                </div>
                <div className="faq-answer">
                  <p>لا، السعر يُحدّث لحظياً بناءً على سعر السوق المحلي، ويتم عرضه داخل التطبيق قبل كل عملية.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/assets/images/waseet.png" alt="وسيط" />
            <p>وسيط - تطبيقك الذكي</p>
          </div>
          <div className="footer-links">
            <a href="/pages/about">من نحن</a>
            <a href="/pages/guide">كيفية الاستخدام</a>
            <a href="/pages/privacy">سياسة الخصوصية</a>
            <a href="/pages/terms">الشروط والأحكام</a>
          </div>
          <div className="footer-social">
            <a href="#" aria-label="تابعنا على تويتر"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="تابعنا على فيسبوك"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="تابعنا على انستقرام"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} وسيط. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
