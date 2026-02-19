import Link from 'next/link';
import { ROUTES, SITE_NAME, SITE_DESCRIPTION } from '@/constants';

export default function HomePage() {
  return (
    <div className="app-wrapper">
      <main className="main-content">
        {/* Hero Section */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-8)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 'var(--container-md)' }}>
            {/* Brand */}
            <h1 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.02em',
            }}>
              {SITE_NAME}
            </h1>

            {/* Tagline */}
            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-8)',
              lineHeight: 'var(--leading-relaxed)',
            }}>
              {SITE_DESCRIPTION}
            </p>

            {/* Description */}
            <p style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-10)',
              maxWidth: '480px',
              margin: '0 auto var(--space-10)',
            }}>
              Create stunning portfolios for your wedding studio.
              Upload and manage wedding content with an intuitive CMS.
              Share your work with clients seamlessly.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link
                href={ROUTES.SIGNUP}
                className="btn btn-primary btn-lg"
              >
                Get Started
              </Link>
              <Link
                href={ROUTES.LOGIN}
                className="btn btn-secondary btn-lg"
              >
                Sign In
              </Link>
            </div>

            {/* Features */}
            <div style={{
              marginTop: 'var(--space-16)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-6)',
              textAlign: 'left',
            }}>
              <div className="card">
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-primary)',
                }}>
                  Custom Portfolio
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  Showcase your wedding photography with a personalized portfolio page.
                </p>
              </div>

              <div className="card">
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-primary)',
                }}>
                  Content Management
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  Upload and organize wedding photos with our intuitive CMS.
                </p>
              </div>

              <div className="card">
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-primary)',
                }}>
                  Client Access
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  Share private galleries with your clients securely.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: 'var(--space-6)',
        textAlign: 'center',
        borderTop: '1px solid var(--border-light)',
      }}>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)'
        }}>
          {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
