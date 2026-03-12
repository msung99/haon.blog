import React from "react";
import { Link } from "gatsby";
import styled from "styled-components";

const MainPostList = ({ posts }) => {
  // isPrivate가 false이고 isMainPost가 true인 항목만 필터링
  const mainPosts = posts.filter(
    post => !post.frontmatter.isPrivate && post.frontmatter.isMainPost
  );

  if (mainPosts.length === 0) {
    return null;
  }

  return (
    <>
      <MainPostsHeader>Main Posts</MainPostsHeader>
      <MainPostListContainer>
        {mainPosts.map((post, index) => {
          const { title } = post.frontmatter;
          const slug = post.fields.slug;

          return (
            <PostItem key={index}>
              <PostLink to={slug}>
                {title || slug}
              </PostLink>
            </PostItem>
          );
        })}
      </MainPostListContainer>
    </>
  );
};

const MainPostsHeader = styled.h2`
  font-size: 16px;
  color: ${props => props.theme.main.text};
  font-weight: bold;
  margin-left: 10px;
  padding-top: 15px;
  padding-bottom: 10px;
`;

const MainPostListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px 10px;
`;

const PostItem = styled.li`
  margin-bottom: 12px;
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.theme.tag.text};
  font-size: 16px;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }

  &::before {
    content: "• ";
    margin-right: 8px;
  }
`;

export default MainPostList;
