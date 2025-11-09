import { DeploymentItem } from "../types";

export interface DeploymentTemplate
  extends Omit<
    DeploymentItem,
    "id" | "project_id" | "created_at" | "updated_at" | "position" | "platform"
  > {
  platform?: DeploymentItem["platform"]; // Make platform optional for universal templates
}

export const PLATFORM_TEMPLATES: Record<string, DeploymentTemplate[]> = {
  vercel: [
    {
      title: "Deploy to Vercel",
      description:
        "Connect your Git repository and deploy your application to Vercel.",
      category: "hosting",
      platform: "vercel",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Confirm the deployment succeeds and the application loads correctly.",
      helpful_links: [
        {
          title: "Vercel Deployment Guide",
          url: "https://vercel.com/docs/deployments",
          description: "Official guide for deploying to Vercel.",
        },
      ],
      tags: ["deployment", "hosting"],
      dependencies: [],
    },
    {
      title: "Configure environment variables in Vercel",
      description:
        "Set all required environment variables in the Vercel dashboard (e.g., API keys, database URLs, secrets).",
      category: "env",
      platform: "vercel",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Test that environment-dependent features work in production.",
      helpful_links: [
        {
          title: "Vercel Environment Variables",
          url: "https://vercel.com/docs/concepts/projects/environment-variables",
          description: "How to set environment variables in Vercel.",
        },
      ],
      tags: ["env-vars", "config"],
      dependencies: [],
    },
    {
      title: "Set up custom domain on Vercel",
      description:
        "Configure your custom domain and ensure it resolves to your Vercel deployment.",
      category: "dns",
      platform: "vercel",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes:
        "Confirm domain resolves correctly and HTTPS/SSL is active.",
      helpful_links: [
        {
          title: "Vercel Custom Domains",
          url: "https://vercel.com/docs/concepts/projects/domains",
          description: "Guide for setting up custom domains on Vercel.",
        },
      ],
      tags: ["domain", "ssl"],
      dependencies: [],
    },
    {
      title: "Enable Vercel Analytics",
      description:
        "Set up Vercel Analytics to monitor application performance and usage.",
      category: "monitoring",
      platform: "vercel",
      environment: "production",
      status: "todo",
      priority: "medium",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Ensure analytics data is collected properly.",
      helpful_links: [
        {
          title: "Vercel Analytics",
          url: "https://vercel.com/docs/analytics",
          description: "Guide to configuring Vercel Analytics.",
        },
      ],
      tags: ["analytics", "monitoring"],
      dependencies: [],
    },
    {
      title: "Verify SSL is active",
      description:
        "Confirm your site uses HTTPS and has a valid SSL certificate",
      category: "ssl",
      platform: "vercel",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Open your deployed site and look for the lock icon in the address bar. Ensure the URL uses https:// and the certificate is valid.",
      helpful_links: [
        {
          title: "Vercel SSL",
          url: "https://vercel.com/docs/concepts/projects/custom-domains#ssl-certificates",
          description: "Guide to configuring SSL on Vercel.",
        },
      ],
      tags: ["ssl", "security"],
      dependencies: [],
    },
  ],

  netlify: [
    {
      title: "Deploy to Netlify",
      description:
        "Connect your Git repository and enable continuous deployment on Netlify.",
      category: "hosting",
      platform: "netlify",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Verify build succeeds and the site is accessible.",
      helpful_links: [
        {
          title: "Netlify Deployment",
          url: "https://docs.netlify.com/site-deploys/create-deploys/",
          description: "How to deploy sites on Netlify.",
        },
      ],
      tags: ["deployment", "hosting"],
      dependencies: [],
    },
    {
      title: "Configure environment variables in Netlify",
      description:
        "Add required environment variables in the Netlify dashboard.",
      category: "env",
      platform: "netlify",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Verify variables are accessible during build and runtime.",
      helpful_links: [
        {
          title: "Netlify Environment Variables",
          url: "https://docs.netlify.com/configure-builds/environment-variables/",
          description: "Managing env vars on Netlify.",
        },
      ],
      tags: ["env", "config"],
      dependencies: [],
    },
    {
      title: "Set up custom domain on Netlify",
      description:
        "Configure your custom domain and SSL in the Netlify dashboard.",
      category: "dns",
      platform: "netlify",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Ensure domain resolves and SSL is working.",
      helpful_links: [
        {
          title: "Netlify Custom Domains",
          url: "https://docs.netlify.com/domains-https/custom-domains/",
          description: "Setting up custom domains on Netlify.",
        },
      ],
      tags: ["dns", "ssl"],
      dependencies: [],
    },
    {
      title: "Enable Netlify Forms (optional)",
      description: "Set up Netlify Forms for user input and submissions.",
      category: "general",
      platform: "netlify",
      environment: "production",
      status: "todo",
      priority: "low",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Test form submission and email notifications.",
      helpful_links: [
        {
          title: "Netlify Forms",
          url: "https://docs.netlify.com/forms/setup/",
          description: "Guide for setting up Netlify Forms.",
        },
      ],
      tags: ["forms", "frontend"],
      dependencies: [],
    },
    {
      title: "Verify SSL is active",
      description:
        "Confirm your site uses HTTPS and has a valid SSL certificate",
      category: "ssl",
      platform: "netlify",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Open your deployed site and look for the lock icon in the address bar. Ensure the URL uses https:// and the certificate is valid.",
      helpful_links: [
        {
          title: "Netlify SSL",
          url: "https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/",
          description: "Guide to configuring SSL on Netlify.",
        },
      ],
      tags: ["ssl", "security"],
      dependencies: [],
    },
  ],

  supabase: [
    {
      title: "Set production redirect URLs in Supabase Auth",
      description:
        "Update Supabase Auth with correct OAuth callback URLs for production.",
      category: "auth",
      platform: "supabase",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Test login/logout from your production domain.",
      helpful_links: [
        {
          title: "Supabase Auth Configuration",
          url: "https://supabase.com/docs/guides/auth/redirect-urls",
          description: "OAuth and redirect URL config.",
        },
      ],
      tags: ["auth", "oauth"],
      dependencies: [],
    },
    {
      title: "Configure Row Level Security (RLS) policies",
      description: "Review and apply proper RLS policies for production data.",
      category: "security",
      platform: "supabase",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Ensure data access is scoped to the correct users.",
      helpful_links: [
        {
          title: "Supabase RLS",
          url: "https://supabase.com/docs/guides/auth/row-level-security",
          description: "RLS setup and usage.",
        },
      ],
      tags: ["database", "security"],
      dependencies: [],
    },
    {
      title: "Configure CORS for production domain",
      description:
        "Allow requests from your production domain in Supabase CORS settings.",
      category: "security",
      platform: "supabase",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Test API requests from your frontend to Supabase.",
      helpful_links: [
        {
          title: "Supabase CORS",
          url: "https://supabase.com/docs/guides/functions/cors",
          description: "CORS configuration guide.",
        },
      ],
      tags: ["security", "cors"],
      dependencies: [],
    },
    {
      title: "Enable Supabase database backups",
      description: "Set up automatic backups for your production database.",
      category: "database",
      platform: "supabase",
      environment: "production",
      status: "todo",
      priority: "medium",
      is_required: false,
      is_auto_generated: true,
      verification_notes:
        "Ensure backups are scheduled and test restore process.",
      helpful_links: [
        {
          title: "Supabase Backups",
          url: "https://supabase.com/docs/guides/platform/backups",
          description: "How to configure backups.",
        },
      ],
      tags: ["backup", "database"],
      dependencies: [],
    },
  ],

  aws: [
    {
      title: "Set up hosting infrastructure in AWS",
      description: "Use S3, CloudFront, and Route 53 to host your application.",
      category: "hosting",
      platform: "aws",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Ensure app is accessible via AWS services.",
      helpful_links: [
        {
          title: "AWS Static Website Hosting",
          url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html",
          description: "Guide to hosting static websites.",
        },
      ],
      tags: ["hosting", "aws"],
      dependencies: [],
    },
    {
      title: "Configure AWS environment variables",
      description:
        "Use Parameter Store or Lambda env variables to store secrets/config.",
      category: "env",
      platform: "aws",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Verify application accesses these values successfully.",
      helpful_links: [
        {
          title: "AWS Parameter Store",
          url: "https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html",
          description: "Managing configuration data securely.",
        },
      ],
      tags: ["env", "aws"],
      dependencies: [],
    },
    {
      title: "Enable AWS CloudFront CDN",
      description:
        "Use CloudFront for global delivery and improved performance.",
      category: "hosting",
      platform: "aws",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes:
        "Confirm content is served globally and caching is effective.",
      helpful_links: [
        {
          title: "AWS CloudFront",
          url: "https://docs.aws.amazon.com/cloudfront/",
          description: "CloudFront overview and setup.",
        },
      ],
      tags: ["cdn", "hosting"],
      dependencies: [],
    },
    {
      title: "Set IAM policies and security groups",
      description:
        "Use least-privilege principles for AWS IAM and secure access.",
      category: "security",
      platform: "aws",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Review access permissions and test IAM roles.",
      helpful_links: [
        {
          title: "AWS Security Best Practices",
          url: "https://docs.aws.amazon.com/general/latest/gr/aws-security-best-practices.html",
          description: "Best practices for securing AWS accounts.",
        },
      ],
      tags: ["security", "iam"],
      dependencies: [],
    },
  ],
};

export const CATEGORY_TEMPLATES: Record<string, DeploymentTemplate[]> = {
  auth: [
    {
      title: "Update OAuth redirect URLs",
      description:
        "Update all OAuth providers (e.g., Google, GitHub) with production redirect URLs.",
      category: "auth",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Test login flow with each provider from your production domain.",
      helpful_links: [],
      tags: ["auth", "oauth"],
      dependencies: [],
    },
    {
      title: "Test authentication flows",
      description:
        "Verify that all authentication flows function correctly in production.",
      category: "auth",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Test signup, login, logout, password reset, and email verification.",
      helpful_links: [],
      tags: ["auth", "testing"],
      dependencies: [],
    },
  ],

  security: [
    {
      title: "Conduct security audit and penetration test",
      description:
        "Perform a final security audit and/or penetration test before going live.",
      category: "security",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Document findings and remediation actions.",
      helpful_links: [
        {
          title: "OWASP Testing Guide",
          url: "https://owasp.org/www-project-web-security-testing-guide/",
          description: "Comprehensive guide for web security testing.",
        },
      ],
      tags: ["security", "audit"],
      dependencies: [],
    },
    {
      title: "Configure security headers",
      description:
        "Set CSP, HSTS, X-Frame-Options, and other security headers.",
      category: "security",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Use online tools to verify headers are properly configured.",
      helpful_links: [
        {
          title: "Security Headers",
          url: "https://securityheaders.com/",
          description: "Test and learn about HTTP security headers.",
        },
      ],
      tags: ["security", "headers"],
      dependencies: [],
    },
  ],

  monitoring: [
    {
      title: "Set up uptime monitoring",
      description:
        "Enable uptime monitoring and alerting for production systems.",
      category: "monitoring",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Test alerting when the site is unreachable.",
      helpful_links: [
        {
          title: "UptimeRobot",
          url: "https://uptimerobot.com/",
          description: "Free uptime monitoring service.",
        },
      ],
      tags: ["monitoring", "uptime"],
      dependencies: [],
    },
    {
      title: "Set up error monitoring",
      description:
        "Configure tools like Sentry, Rollbar, or LogRocket to track production errors.",
      category: "monitoring",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: false,
      is_auto_generated: true,
      verification_notes:
        "Confirm errors are reported and alerts are functioning.",
      helpful_links: [
        {
          title: "Sentry Setup",
          url: "https://docs.sentry.io/platforms/",
          description: "Sentry platform integration docs.",
        },
      ],
      tags: ["monitoring", "errors"],
      dependencies: [],
    },
    {
      title: "Configure analytics tracking",
      description:
        "Set up analytics (Google Analytics, Mixpanel, etc.) to track usage.",
      category: "monitoring",
      environment: "production",
      status: "todo",
      priority: "medium",
      is_required: false,
      is_auto_generated: true,
      verification_notes: "Verify key events and page views are being tracked.",
      helpful_links: [
        {
          title: "Google Analytics 4",
          url: "https://support.google.com/analytics/answer/10089681",
          description: "Set up GA4 for your app.",
        },
      ],
      tags: ["analytics", "monitoring"],
      dependencies: [],
    },
  ],

  testing: [
    {
      title: "Run production smoke tests",
      description:
        "Perform critical user flow tests in production (e.g., login, purchase, etc.).",
      category: "testing",
      environment: "production",
      status: "todo",
      priority: "critical",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Document results and fix any regressions.",
      helpful_links: [],
      tags: ["testing", "qa"],
      dependencies: [],
    },
  ],

  ssl: [
    {
      title: "Ensure SSL certificate is active",
      description:
        "Confirm your site uses HTTPS and has a valid SSL certificate issued by your hosting platform (e.g., Vercel, Netlify)",
      category: "ssl",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes:
        "Open your deployed site and look for the lock icon in the address bar. Ensure the URL uses https:// and the certificate is valid.",
      helpful_links: [
        {
          title: "Let's Encrypt",
          url: "https://letsencrypt.org/getting-started/",
          description: "Free SSL certificates setup.",
        },
      ],
      tags: ["ssl", "security"],
      dependencies: [],
    },
  ],

  database: [
    {
      title: "Configure automated database backups",
      description: "Set up backups and verify recovery procedures.",
      category: "database",
      environment: "production",
      status: "todo",
      priority: "high",
      is_required: true,
      is_auto_generated: true,
      verification_notes: "Test restoration and verify backup frequency.",
      helpful_links: [],
      tags: ["database", "backup"],
      dependencies: [],
    },
  ],

  performance: [
    {
      title: "Run performance checks",
      description:
        "Use tools like PageSpeed Insights or Lighthouse to assess performance.",
      category: "performance",
      environment: "production",
      status: "todo",
      priority: "medium",
      is_required: false,
      is_auto_generated: true,
      verification_notes:
        "Optimize loading times and reduce unnecessary blocking resources.",
      helpful_links: [
        {
          title: "Google PageSpeed Insights",
          url: "https://pagespeed.web.dev/",
          description: "Measure and improve web performance.",
        },
      ],
      tags: ["performance", "optimization"],
      dependencies: [],
    },
  ],
};
