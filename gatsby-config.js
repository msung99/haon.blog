/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `haon.blog`,
    description: `꾸준히 성장하는 과정속에서, 배움을 공유하는 블로그입니다.`,
    author: `Haon`,
    siteUrl: `https://haon.blog/`,
    keywords: [`server`, `backend`, `gatsby`], 
    repo: 'msung99/haon.blog',
    socialLinks: { 
      github: 'https://github.com/msung99', 
      instagram: 'https://www.instagram.com/iminseong920/', 
      facebook: 'https://www.facebook.com/', 
      linkedin: 'https://www.linkedin.com/',
      velog: 'https://velog.io/@msung99',
      email: 'https://msung6924@naver.com',
  },
  },
  plugins: [
    {
      resolve: "gatsby-plugin-gtag",
      options: {
        trackingId: ["G-42LYTXMN1Y"],
      },
    },
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 700,
              maxHeight: 400,
            },
          },
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`
          }
        ],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: `${__dirname}/src/contents/posts`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        display: `minimal-ui`,
        icon: `static/profile.png`,
      },
    },
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
  ],
}
