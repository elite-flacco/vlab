import { DeploymentItem } from '../types';

export interface DeploymentTemplate extends Omit<DeploymentItem, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'position'> {}

export const PLATFORM_TEMPLATES: Record<string, DeploymentTemplate[]> = {
  vercel: [
    {
      title: 'Deploy to Vercel',
      description: 'Connect your Git repository and deploy your application to Vercel',
      category: 'hosting',
      platform: 'vercel',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify deployment succeeds and application loads correctly',
      helpful_links: [
        { title: 'Vercel Deployment Guide', url: 'https://vercel.com/docs/deployments', description: 'Official guide for deploying to Vercel' }
      ],
      tags: ['deployment', 'hosting'],
      dependencies: [],
    },
    {
      title: 'Configure Vercel environment variables',
      description: 'Set up all required environment variables in Vercel dashboard including API keys, database URLs, and authentication secrets',
      category: 'env',
      platform: 'vercel',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test that all environment-dependent features work in production',
      helpful_links: [
        { title: 'Vercel Environment Variables', url: 'https://vercel.com/docs/concepts/projects/environment-variables', description: 'How to set environment variables in Vercel' }
      ],
      tags: ['env-vars', 'config'],
      dependencies: [],
    },
    {
      title: 'Set up custom domain on Vercel',
      description: 'Configure your custom domain and ensure it points to your Vercel deployment',
      category: 'dns',
      platform: 'vercel',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify domain resolves correctly and SSL certificate is active',
      helpful_links: [
        { title: 'Vercel Custom Domains', url: 'https://vercel.com/docs/concepts/projects/domains', description: 'Guide for setting up custom domains' }
      ],
      tags: ['domain', 'ssl'],
      dependencies: [],
    },
    {
      title: 'Configure Vercel analytics',
      description: 'Enable Vercel Analytics to monitor your application performance and usage',
      category: 'monitoring',
      platform: 'vercel',
      environment: 'production',
      status: 'todo',
      priority: 'medium',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify analytics data is being collected correctly',
      helpful_links: [
        { title: 'Vercel Analytics', url: 'https://vercel.com/docs/analytics', description: 'Setting up Vercel Analytics' }
      ],
      tags: ['analytics', 'monitoring'],
      dependencies: [],
    },
  ],

  netlify: [
    {
      title: 'Deploy to Netlify',
      description: 'Connect your Git repository and set up continuous deployment on Netlify',
      category: 'hosting',
      platform: 'netlify',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify build completes successfully and site is accessible',
      helpful_links: [
        { title: 'Netlify Deployment', url: 'https://docs.netlify.com/site-deploys/create-deploys/', description: 'How to deploy sites on Netlify' }
      ],
      tags: ['deployment', 'hosting'],
      dependencies: [],
    },
    {
      title: 'Configure Netlify environment variables',
      description: 'Set up environment variables in Netlify dashboard for API keys and configuration',
      category: 'env',
      platform: 'netlify',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test that environment variables are accessible during build and runtime',
      helpful_links: [
        { title: 'Netlify Environment Variables', url: 'https://docs.netlify.com/environment-variables/', description: 'Managing environment variables on Netlify' }
      ],
      tags: ['env', 'deployment'],
      dependencies: [],
    },
    {
      title: 'Set up custom domain on Netlify',
      description: 'Configure your custom domain and SSL certificate on Netlify',
      category: 'dns',
      platform: 'netlify',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify domain points to Netlify and SSL is working',
      helpful_links: [
        { title: 'Netlify Custom Domains', url: 'https://docs.netlify.com/domains-https/custom-domains/', description: 'Setting up custom domains on Netlify' }
      ],
      tags: ['dns', 'deployment'],
      dependencies: [],
    },
    {
      title: 'Configure Netlify Forms (if needed)',
      description: 'Set up Netlify Forms for contact forms or user submissions',
      category: 'general',
      platform: 'netlify',
      environment: 'production',
      status: 'todo',
      priority: 'low',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Test form submissions and notification delivery',
      helpful_links: [
        { title: 'Netlify Forms', url: 'https://docs.netlify.com/forms/setup/', description: 'Setting up forms on Netlify' }
      ],
      tags: ['forms', 'deployment'],
      dependencies: [],
    },
  ],

  supabase: [
    {
      title: 'Configure Supabase authentication redirect URLs',
      description: 'Update authentication providers with production domain URLs for OAuth callbacks',
      category: 'auth',
      platform: 'supabase',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test login/logout flow from production domain',
      helpful_links: [
        { title: 'Supabase Auth Configuration', url: 'https://supabase.com/docs/guides/auth/configuration', description: 'Configuring authentication settings' }
      ],
      tags: ['auth', 'oauth'],
      dependencies: [],
    },
    {
      title: 'Set up Supabase RLS policies for production',
      description: 'Review and configure Row Level Security policies for production data access',
      category: 'security',
      platform: 'supabase',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test that data access is properly restricted based on user permissions',
      helpful_links: [
        { title: 'Supabase RLS', url: 'https://supabase.com/docs/guides/auth/row-level-security', description: 'Row Level Security guide' }
      ],
      tags: ['security', 'database'],
      dependencies: [],
    },
    {
      title: 'Configure Supabase CORS settings',
      description: 'Update CORS settings to allow requests from your production domain',
      category: 'security',
      platform: 'supabase',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify API requests work from production domain',
      helpful_links: [
        { title: 'Supabase CORS', url: 'https://supabase.com/docs/guides/api/cors', description: 'Configuring CORS settings' }
      ],
      tags: ['security', 'cors'],
      dependencies: [],
    },
    {
      title: 'Set up Supabase database backups',
      description: 'Configure automatic database backups for your production database',
      category: 'database',
      platform: 'supabase',
      environment: 'production',
      status: 'todo',
      priority: 'medium',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify backup schedule is configured and test restore process',
      helpful_links: [
        { title: 'Supabase Backups', url: 'https://supabase.com/docs/guides/platform/backups', description: 'Database backup configuration' }
      ],
      tags: ['database', 'backup'],
      dependencies: [],
    },
  ],

  aws: [
    {
      title: 'Set up AWS hosting infrastructure',
      description: 'Configure AWS services (S3, CloudFront, Route 53) for hosting your application',
      category: 'hosting',
      platform: 'aws',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify application is accessible through AWS infrastructure',
      helpful_links: [
        { title: 'AWS Static Website Hosting', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html', description: 'Hosting static websites on AWS' }
      ],
      tags: ['hosting', 'aws'],
      dependencies: [],
    },
    {
      title: 'Configure AWS environment variables',
      description: 'Set up environment variables using AWS Systems Manager Parameter Store or Lambda environment variables',
      category: 'env',
      platform: 'aws',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test that environment variables are accessible to your application',
      helpful_links: [
        { title: 'AWS Parameter Store', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html', description: 'Managing configuration data with Parameter Store' }
      ],
      tags: ['env', 'aws'],
      dependencies: [],
    },
    {
      title: 'Set up AWS CloudFront CDN',
      description: 'Configure CloudFront for global content delivery and caching',
      category: 'hosting',
      platform: 'aws',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify content is served from CDN and caching works correctly',
      helpful_links: [
        { title: 'AWS CloudFront', url: 'https://docs.aws.amazon.com/cloudfront/', description: 'CloudFront documentation' }
      ],
      tags: ['hosting', 'aws'],
      dependencies: [],
    },
    {
      title: 'Configure AWS security groups and IAM',
      description: 'Set up proper security groups and IAM roles for least-privilege access',
      category: 'security',
      platform: 'aws',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Review and test access permissions, ensure principle of least privilege',
      helpful_links: [
        { title: 'AWS Security Best Practices', url: 'https://docs.aws.amazon.com/security/?id=docs_gateway', description: 'AWS security documentation' }
      ],
      tags: ['security', 'aws'],
      dependencies: [],
    },
  ],

  general: [
    {
      title: 'Test production deployment',
      description: 'Run comprehensive tests on the production environment including all critical user flows',
      category: 'testing',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Document test results and any issues found during testing',
      helpful_links: [],
      tags: ['testing', 'qa'],
      dependencies: [],
    },
    {
      title: 'Set up error monitoring',
      description: 'Configure error tracking service like Sentry, LogRocket, or Rollbar to monitor production issues',
      category: 'monitoring',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify errors are being captured and alerts are working',
      helpful_links: [
        { title: 'Sentry Setup', url: 'https://docs.sentry.io/platforms/', description: 'Error monitoring with Sentry' }
      ],
      tags: ['monitoring', 'errors'],
      dependencies: [],
    },
    {
      title: 'Configure analytics tracking',
      description: 'Set up Google Analytics, Mixpanel, or similar analytics service to track user behavior',
      category: 'monitoring',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'medium',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Verify analytics events are being tracked correctly',
      helpful_links: [
        { title: 'Google Analytics 4', url: 'https://support.google.com/analytics/answer/10089681', description: 'Setting up Google Analytics 4' }
      ],
      tags: ['monitoring', 'analytics'],
      dependencies: [],
    },
    {
      title: 'Set up SSL certificate',
      description: 'Ensure SSL certificate is properly installed and configured for HTTPS',
      category: 'ssl',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify HTTPS redirect works and certificate is valid',
      helpful_links: [
        { title: "Let's Encrypt", url: 'https://letsencrypt.org/getting-started/', description: 'Free SSL certificates' }
      ],
      tags: ['ssl', 'security'],
      dependencies: [],
    },
    {
      title: 'Configure security headers',
      description: 'Set up proper security headers (CSP, HSTS, X-Frame-Options) for enhanced security',
      category: 'security',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test security headers using security header analyzers',
      helpful_links: [
        { title: 'Security Headers', url: 'https://securityheaders.com/', description: 'Test and learn about security headers' }
      ],
      tags: ['security', 'headers'],
      dependencies: [],
    },
    {
      title: 'Set up database backups',
      description: 'Configure automated database backups and test restore procedures',
      category: 'database',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Verify backup schedule and test restore process',
      helpful_links: [],
      tags: ['database', 'backup'],
      dependencies: [],
    },
    {
      title: 'Performance optimization',
      description: 'Optimize loading times, implement caching, and configure performance monitoring',
      category: 'general',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'medium',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Run performance tests and verify acceptable loading times',
      helpful_links: [
        { title: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/', description: 'Test and optimize page performance' }
      ],
      tags: ['performance', 'optimization'],
      dependencies: [],
    },
  ],
};

export const CATEGORY_TEMPLATES: Record<string, DeploymentTemplate[]> = {
  auth: [
    {
      title: 'Update OAuth redirect URLs',
      description: 'Update all OAuth providers (Google, GitHub, etc.) with production redirect URLs',
      category: 'auth',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test login flow with each OAuth provider from production domain',
      helpful_links: [],
      tags: ['auth', 'oauth'],
      dependencies: [],
    },
    {
      title: 'Test authentication flows',
      description: 'Verify all authentication flows work correctly in production environment',
      category: 'auth',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'critical',
      is_required: true,
      is_auto_generated: true,
      verification_notes: 'Test signup, login, logout, password reset, and email verification',
      helpful_links: [],
      tags: ['auth', 'testing'],
      dependencies: [],
    },
  ],

  security: [
    {
      title: 'Security audit and penetration testing',
      description: 'Conduct security audit and penetration testing before going live',
      category: 'security',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Document security findings and remediation steps',
      helpful_links: [
        { title: 'OWASP Testing Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/', description: 'Web security testing guide' }
      ],
      tags: ['security', 'audit'],
      dependencies: [],
    },
  ],

  monitoring: [
    {
      title: 'Set up uptime monitoring',
      description: 'Configure uptime monitoring service to alert when site goes down',
      category: 'monitoring',
      platform: 'general',
      environment: 'production',
      status: 'todo',
      priority: 'high',
      is_required: false,
      is_auto_generated: true,
      verification_notes: 'Test alert notifications when service is temporarily unavailable',
      helpful_links: [
        { title: 'UptimeRobot', url: 'https://uptimerobot.com/', description: 'Free uptime monitoring service' }
      ],
      tags: ['monitoring', 'uptime'],
      dependencies: [],
    },
  ],
};