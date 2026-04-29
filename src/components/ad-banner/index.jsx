import React from "react";
import AdSense from "react-adsense";
import styled from "styled-components";

const AdBanner = () => (
  <Wrapper>
    <AdSense.Google
      client="ca-pub-6065231424263745"
      slot="2668200011"
      style={{ display: "block" }}
      format="horizontal"
      responsive="true"
    />
  </Wrapper>
);

const Wrapper = styled.div`
  width: 100%;
  margin-top: -50px;
  margin-bottom: 40px;
`;

export default AdBanner;
