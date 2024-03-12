import React from "react";
import { Link } from "gatsby";
import styled from "styled-components";
import { FaInstagram, FaFacebook, FaLinkedin, FaGithub } from "react-icons/fa";
import { SiVelog } from "react-icons/si";
import { MdOutlineEmail } from "react-icons/md";
import { BsFillRssFill } from "react-icons/bs";

const EmojiLink = styled.span`
  cursor: pointer;
  color: ${props => props.theme.emoji};
`;

const socialEmojis = {
  github: <FaGithub className="icon" size="28" />,
  instagram: <FaInstagram className="icon" size="28" />,
  facebook: <FaFacebook className="icon" size="28" />,
  linkedin: <FaLinkedin className="icon" size="28" />,
  velog: <SiVelog className="icon" size="28" />,
  email: <MdOutlineEmail className="icon" size="28" />,
};

const StyledSocialLinks = styled.div`
  display: flex;
  gap: 14px;
  margin-left: 15px;
  margin-bottom: 30px;
`;

const SocialLinks = ({ socialLinks }) => {
  return (
    <StyledSocialLinks>
      <EmojiLink>
        <Link to ="/rss.xml">
            <BsFillRssFill className="icon" size="28" color="white"/>
        </Link>
      </EmojiLink>
      {Object.entries(socialLinks).map(([key, link]) => (
        <Link key={key} to={link}>
          <EmojiLink>
            {socialEmojis[key] && socialEmojis[key]}
          </EmojiLink>
        </Link>
      ))}
    </StyledSocialLinks>
  );
};

export default SocialLinks;
