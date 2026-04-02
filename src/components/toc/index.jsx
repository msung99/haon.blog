import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";

const TableOfContents = ({ content }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeId, setActiveId] = useState("");
  const tocRef = useRef(null);

  const handleScroll = () => {
    setIsSticky(window.scrollY > 300);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // 페이지의 모든 헤딩 요소 찾기
    const headings = document.querySelectorAll("h1[id], h2[id], h3[id]");

    if (headings.length === 0) return;

    // 각 헤딩의 가시성 상태를 추적
    const headingStates = new Map();

    // Intersection Observer 설정
    const observer = new IntersectionObserver(
      (entries) => {
        // 각 entry의 상태를 업데이트
        entries.forEach((entry) => {
          headingStates.set(entry.target.id, entry.isIntersecting);
        });

        // viewport에 보이는 헤딩들 찾기
        const visibleHeadings = Array.from(headings).filter((heading) =>
          headingStates.get(heading.id)
        );

        if (visibleHeadings.length > 0) {
          // 가장 위에 있는 헤딩 찾기
          const topHeading = visibleHeadings.reduce((closest, heading) => {
            const headingTop = heading.getBoundingClientRect().top;
            const closestTop = closest.getBoundingClientRect().top;
            return Math.abs(headingTop) < Math.abs(closestTop)
              ? heading
              : closest;
          });

          setActiveId(topHeading.id);
        }
      },
      {
        rootMargin: "-100px 0px -66% 0px",
        threshold: 0,
      }
    );

    // 모든 헤딩 관찰 시작
    headings.forEach((heading) => {
      headingStates.set(heading.id, false);
      observer.observe(heading);
    });

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, [content]);

  useEffect(() => {
    // TOC 링크에 active 클래스 추가/제거
    if (!tocRef.current || !activeId) return;

    const links = tocRef.current.querySelectorAll("a");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === `#${activeId}`) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }, [activeId]);

  return (
    <TocWrapper>
      <Toc
        ref={tocRef}
        isSticky={isSticky}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </TocWrapper>
  );
};

const TocWrapper = styled.div`
  position: relative;
`;

const Toc = styled.div`
  position: ${(props) => (props.isSticky ? "fixed" : "absolute")};
  left: ${(props) => (props.isSticky ? "80%" : "110%")};
  top: 15%;
  width: 230px;
  font-size: 14px;
  max-height: calc(100vh - 220px);
  overflow: auto;
  padding-right: 15px;
  border-left: 1px solid #808080;
  line-height: 130%;

  @media (max-width: 1300px) {
    display: none;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-top: 8px;
    margin-bottom: 6px;
    margin-left: 15px;

    p {
      margin: 10px;
    }

    a {
      color: ${props => props.theme.post.toc.a};
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease-in-out;

      &:hover {
        color: ${props => props.theme.post.toc.hover};
      }

      &.active {
        color: ${props => props.theme.post.toc.active};
        font-weight: 600;
      }
    }
  }
`;

export default TableOfContents;
