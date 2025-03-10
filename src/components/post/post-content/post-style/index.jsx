import styled from "styled-components";


export const ContentWrapper = styled.div`
  position: relative;
`;  


export const HtmlWrapper = styled.div`
  section > h1 {
    font-size: 1.6rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    word-break: break-all;
    font-weight: 700;
    line-height: 120%;
  }

  section > h2 {
    font-size: 1.4rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    word-break: break-all;
    font-weight: 700;
    line-height: 120%;
  }

  section > h3 {
    font-size: 1.2rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    word-break: break-all;
    font-weight: 700;
    line-height: 110%;
  }

  section > h4 {
    font-size: 1.05rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    word-break: break-all;
    font-weight: 700;
    line-height: 110%;
  }

  section > h5 {
    font-size: 0.9rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    word-break: break-all;
    font-weight: 700;
  }

  section > h6 {
    font-size: 0.7rem;
    color: ${props => props.theme.post.content.text};
    margin-top: 40px;
    margin-bottom: 20px;
    font-weight: 700;
  }

  table {
    border-collapse: collapse;
    font-size: 14.5px;
    color: ${props => props.theme.main.text};
    border: 0.5px solid ${props => props.theme.main.text};

    thead {
      tr {
        th {
          background-color: ${props => props.theme.tag.hover};
          padding-bottom: 20px;
          padding-top: 10px;
          padding-left: 10px;
          border-bottom: 0.1px solid ${props => props.theme.main.text};
          border-left: 0.1px solid ${props => props.theme.main.text};
        }
      }
    }
  }

  td:nth-child(odd) {
    background-color: ${props => props.theme.tag.background};
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 10px;
    padding-right: 20px;
    border-bottom: 0.5px solid ${props => props.theme.main.text};
    border-right: 0.1px solid  ${props => props.theme.main.text};
  }

  td:nth-child(even) {
    background-color: ${props => props.theme.tag.background};
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 15px;
    padding-right: 20px;
    border-bottom: 0.1px solid ${props => props.theme.main.text};
  }

  tr:last-child td {
    border-bottom: none;
  }

  section > p {
    font-size: 16px;
    line-height: 170%; 
    color: ${props => props.theme.post.content.text};
    margin-bottom: 20px;
    word-break: break-all;

    span {
      margin-top: 40px;
      margin-bottom: 40px;
      font-size: 100px;
    }
  }

  strong {
    font-weight: bold;
  }

  .gatsby-resp-image-wrapper {
    margin-top: -20px;
    margin-bottom: -20px;
  }

  blockquote {
    padding-left: 18px;
    padding-right: 20px;
    padding-top: 25px;
    padding-bottom: 25px;
    margin-bottom: 50px; 
    margin-top: 50px;
    background-color: ${props => props.theme.post.content.blockquote.body};
    line-height: 170%;
    color: ${props => props.theme.post.content.blockquote.text};
    border-left: 6px solid ${props => props.theme.post.content.blockquote.left};
    word-break: break-all;
  }

  hr {
    height: 2px;
    border: 0;
    background-color: ${props => props.theme.post.content.hr};
    margin-top: 50px;
    margin-bottom: 50px;
    word-break: break-all;
  }

  a {
    color: ${props => props.theme.post.content.a};
    word-break: break-all;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: fill;
    margin-top: 30px;
    margin-bottom: 30px;
  }

  ul {
    line-height: 180%; 
    word-break: break-all;
  }

  li {
    color: ${props => props.theme.post.content.li};
    list-style-type: disc;
    margin-left: 20px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  ::marker {
    font-size: 10px;
  }

  code.language-text {
    background-color: ${props => props.theme.post.content.highlight.text};
    color: ${props => props.theme.main.text};
    font-size: 14.5px;
  }

  .gatsby-highlight > pre > .language-text {
    background-color: ${props => props.theme.post.content.highlight.bg};
    color: blue;
    padding: -10px;
    font-size: 13.5px;
    color: ${props => props.theme.post.content.language.text};
    word-break: break-all;
  }

  & figcaption {
    margin-top: 5px;
    margin-bottom: 10px;
    text-align: center;
    color: #868e96;
    font-size: 12px;
    font-style: italic;
  }
}
`



