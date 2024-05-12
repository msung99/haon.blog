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
    description: `꾸준히, 배움에 대한 생각을 글로 정제하기 위한 블로그입니다.`,
    author: `Haon`,
    siteUrl: `https://haon.blog/`,
    keywords: [`backend`, `gatsby starter`], 
    repo: 'msung99/haon.blog',
    socialLinks: { 
      github: 'https://github.com/msung99', 
      instagram: 'https://www.instagram.com/iminseong920/', 
      facebook: 'https://www.facebook.com/', 
      linkedin: 'https://www.linkedin.com/',
      velog: 'https://velog.io/@msung99',
      email: 'msung6924@naver.com',
  },
  },
  plugins: [
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ 'content:encoded': edge.node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { fields: [frontmatter___date], order: DESC }
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                      }
                    }
                  }
                }
              }
            `,
            output: '/rss.xml',
            title: `RSS Feed`,
            match: "^/blog/",
          },
        ],
      },
    },
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
        name: `gatsby-starter-haon`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        display: `standalone`,
        icon: `static/favicon.png`,
      },
    },
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-advanced-sitemap`,
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        host: "https://haon.blog",
        sitemap: "https://haon.blog/sitemap.xml",
        policy: [{userAgent: '*', allow: '/'}]
      }
    },
  ],  
}
