import type { MetadataRoute } from 'next';

/**
 * Enterprise-grade Progressive Web App (PWA) manifest
 * Enables app-like experience on mobile devices and app stores
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Basic metadata
    name: 'TalentBridge - Job Portal & Recruitment Platform',
    short_name: 'TalentBridge',
    description:
      "India's leading job portal. Find jobs, post openings, hire top talent, and build your career with TalentBridge.",

    // PWA behavior
    start_url: '/?utm_source=pwa',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',

    // Colors
    background_color: '#ffffff',
    theme_color: '#2563EB',

    // Categories for app stores
    categories: ['business', 'productivity', 'lifestyle'],

    // Icons - Comprehensive set for all platforms
    icons: [
      // Standard icons with 'any' purpose (default display)
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },

      // Maskable icons for Android adaptive icons
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],

    // Screenshots for app stores (optional but recommended)
    screenshots: [
      {
        src: '/screenshots/home-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Home screen - Find jobs and opportunities',
      },
      {
        src: '/screenshots/jobs-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Job listings with smart filters',
      },
      {
        src: '/screenshots/profile-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Professional profile builder',
      },
      {
        src: '/screenshots/home-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop experience',
      },
    ],

    // Shortcuts - Quick actions from home screen (Android/Windows)
    shortcuts: [
      {
        name: 'Find Jobs',
        short_name: 'Jobs',
        description: 'Search and browse job openings',
        url: '/candidate/jobs?utm_source=pwa_shortcut',
        icons: [
          {
            src: '/shortcuts/search-jobs.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'My Profile',
        short_name: 'Profile',
        description: 'View and edit your profile',
        url: '/candidate/profile?utm_source=pwa_shortcut',
        icons: [
          {
            src: '/shortcuts/profile.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Applications',
        short_name: 'Applied',
        description: 'Track your job applications',
        url: '/candidate/jobs/applied?utm_source=pwa_shortcut',
        icons: [
          {
            src: '/shortcuts/applications.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Post a Job',
        short_name: 'Post Job',
        description: 'Create a new job posting',
        url: '/employer/jobs/new?utm_source=pwa_shortcut',
        icons: [
          {
            src: '/shortcuts/post-job.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],

    // Share target - Allow sharing job links to the app
    share_target: {
      action: '/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },

    // Related applications (optional - for app store links)
    related_applications: [
      // Uncomment when you have mobile apps
      // {
      //   platform: 'play',
      //   url: 'https://play.google.com/store/apps/details?id=com.talentbridge.app',
      //   id: 'com.talentbridge.app',
      // },
      // {
      //   platform: 'itunes',
      //   url: 'https://apps.apple.com/app/talentbridge/id123456789',
      // },
    ],
    prefer_related_applications: false,

    // Display overrides for different form factors
    display_override: ['window-controls-overlay', 'standalone', 'browser'],
  };
}
