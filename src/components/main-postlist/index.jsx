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
          const { title, previewImage } = post.frontmatter;
          const slug = post.fields.slug;

          return (
            <PostItem key={index}>
              <PostLink to={slug}>
                <Thumbnail previewImage={previewImage} />
                <PostTitle>{title || slug}</PostTitle>
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
  color: ${props => props.theme.tag.text};
  font-weight: bold;
  margin-left: 10px;
  padding-top: 5px;
  padding-bottom: 10px;
`;

const MainPostListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px 10px;
`;

const PostItem = styled.li`
  margin-bottom: 12px;
  display: flex;
  align-items: center;

  &::before {
    content: "• ";
    margin-right: 8px;
    color: ${props => props.theme.tag.text};
  }
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.theme.tag.text};
  font-size: 16px;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    opacity: 0.7;
  }
`;

const Thumbnail = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-image: url(${props => (props.previewImage ? `/${props.previewImage}` : `/default.png`)});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`;

const PostTitle = styled.span`
  &:hover {
    text-decoration: underline;
  }
`;

export default MainPostList;
