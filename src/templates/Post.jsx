import React from "react";
import { Link, graphql } from "gatsby";
import Post from "../components/post/post-component";
import PageLayout from "../components/layout/page-component";
import PostContent from "../components/post/post-content";
import Utterances from "../components/utterances";
import Seo from "../components/seo";

export default ({ data, location }) => {
  const { previous, next } = data;
  const post = data.markdownRemark;
  const { title, date, description } = post.frontmatter;
  const author = data.site.siteMetadata.author;
  const exercpt = post.excerpt;
  const toc = post.tableOfContents;
  const tags = post.frontmatter.tags || [];
  const series = post.frontmatter.series;

  return (
    <PageLayout>
      <Seo title={title} description={description || exercpt}/>
      <Post>
        <Post.Header
          title={title}
          date={date}
          author={author}
          tags={tags}
          series={series}
        />
        <PostContent html={post.html} toc={toc}/>
        <Post.Footer previous={previous} next={next}/>
      </Post>
      <Utterances/>
    </PageLayout>
  );
};

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      tableOfContents(maxDepth: 3)
      frontmatter {
        title
        description
        date(formatString: "MMMM DD, YYYY")
        tags
        series
        previewImage
        isPrivate
      }
    }
    previous: markdownRemark(
      id: { eq: $previousPostId }
      frontmatter: { isPrivate: { ne: true } }
    ) {
      fields {
        slug
      }
      frontmatter {
        title
        isPrivate
      }
    }
    next: markdownRemark(
      id: { eq: $nextPostId }
      frontmatter: { isPrivate: { ne: true } }
    ) {
      fields {
        slug
      }
      frontmatter {
        title
        isPrivate
      }
    }
  }
`;
