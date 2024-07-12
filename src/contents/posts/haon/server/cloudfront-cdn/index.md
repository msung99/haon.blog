---
title: AWS CloudFront로 CDN 환경 구축하기
date: "2023-02-09"
tags:
  - AWS
previewImage: server.png
---

## CDN이란?

CDN(Content Delivery Network)은 **지리적 제약 없이 전 세계 사용자에게 빠르고 안전하게 콘텐츠를 전송**할 수 있는 콘텐츠 전송 기술을 의미합니다.

CDN 은 **전세계 지역에 골구로 캐시 서버(PoP) 를 분산 배치**하여 서버와 사용자간의 물리적인 거리를 줄임으로써, 컨텐츠를 불러오는 소요시간을 최소화하는 캐싱 방식입니다.
예를 들어 미국에 있는 사용자가 한국에 호스팅 된 웹 사이트에 접근하는 경우 미국에 위치한 PoP 서버에서 웹사이트 콘텐츠를 사용자에게 전송하는 방식이죠.

---

## CloudFront 란

![](https://velog.velcdn.com/images/msung99/post/0071cba9-6ca9-4f54-8c74-a77843f33b2a/image.png)

CloudFront 는 AWS 에서 CDN 서비스를 제공하기 위한 기능입니다.
즉 CloudFront 는 html, css, js 및 이미지 파일과 같은 정적 및 동적 웹 컨텐츠를 사용자에게 더 빨리 배포할 수 있도록 지원하는 웹 서비스입니다.

---

## AWS S3 와 CloudFront 의 조합

결국 S3 저장소를 사용시 CloudFront 를 사용하면 S3 에 직접 접근하는 경우를 줄여서 **S3 저장소에 대한 자체적인 부하를 줄일 수 있습니다.** S3 에서 데이터를 매번 직접 추출해내는 방식이 아닌, CloudFront 네트워크에 캐싱해 놓은 데이터를 추출하면 되기 때문이죠.

또 이외에 **안정성, 가용성, 속도**등 개발자가 고려해야할 성능개선 부분들을 AWS CloudFront 에서 모두 제공해주니, 저희는 S3 와 CloudFront 를 연결해두고 파일을 불러서 사용하기만 하면 됩니다.

---

## S3 버킷생성

S3 저장소 환경 셋팅과정은 어렵지 않습니다. S3 서비스에 접속하셔서 아래와 같이 "버킷 만들기" 를 누르고 버킷을 생성해주도록 합시다.

![](https://velog.velcdn.com/images/msung99/post/504df221-7c09-4a45-a28f-5cbb074408b3/image.png)

이때 신경써야할 점은 현재 생성할 버킷에 대한 퍼블릭 엑세스 차단 설정을 해제해주는 것입니다. [AWS 공식 가이드라인](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html) 에 따르면, CloudFront 가 S3 버킷안의 컨텐츠를 제공하려면 모든 퍼블릭 엑세스를 차단 해제해주어야 한다고 합니다.

몰론 이 설정으로 인해 S3 저장소가 퍼블릭 상태가 되어서 유출될 수 있으나, CloudFront 가 이 저장소에 접근하려면 공개상태로 바꿔야하는 것이죠.

![](https://velog.velcdn.com/images/msung99/post/d493eae0-ac95-4998-8a0a-983cb24e0e2b/image.png)

---

## CloudFront 배포 설정

다음으로 CloudFront 에 대한 배포도 설정해봅시다. CloudFront 를 검색한후, 아래와 같이 CloudFront 배포 생성 버튼을 누릅시다.

![](https://velog.velcdn.com/images/msung99/post/c58caf8e-b640-4353-8152-f57705d9aa7a/image.png)

그에 대한 세부사항은 모두 기본설정으로 진행하되, 아래와 같은 선택란만 별도로 신경써서 설정해줍시다. 원본 도메인에는 저희가 앞서 생성한 S3 버킷을 선택해줍시다. 또 S3 버킷 엑세스 권한은 "원본 엑세스 제어 설정" 을 선택한 후 CloudFront 로만 접근 가능하도록 제한해줍시다.

![](https://velog.velcdn.com/images/msung99/post/982f10d5-5f61-41f5-bd89-6cf069ffcfc6/image.png)

---

## Web URL 로 S3의 이미지 접근해보기

이렇게 셋팅이 완료되었다면, CloudFront 도메인 주소에 기반해서 S3 버킷의 특정 이미지 데이터에 접근해봅시다. 접근 형식은 아래와 같습니다.

```
"CloudFront 도메인 주소"/"S3버킷 이미지 데이터 이름"

ex) https://qwer.cloudfront.net/스크린샷%202023-02-05%20오후%201.28.08.png
```

그런데 문제는 이렇게 접근시 아래처럼 Access Denied 가 뜹니다. 왜 이렇게 되는걸까요?

![](https://velog.velcdn.com/images/msung99/post/07b01206-fee9-45a8-8e8c-c5513c885fbd/image.png)

---

## S3 권한 정책수정

Access Denied 가 뜨는 이유는 S3 자체적인 정책이 AWS 사용자만 파일에 접근할 수 있도록 제어하고 있기 떄문입니다.
S3 의 디폴트 정책은 특정 파일만 외부로 접근이 가능하게 하는것입니다. 따라서 특정 파일에 대해 외부접근 권한을 열어주는 것이 아닌, 특정 폴더에 대한 권한을 열어주거나, 또는 모든 권한을 열어주는 방식으로 **외부접근 권한 범위를 넓혀줍시다.**

아래처럼 기존에 생성한 S3 버킷을 선택하고 편집을 해줍시다.

![](https://velog.velcdn.com/images/msung99/post/97f51df3-d9ed-4880-9c89-7f180365801d/image.png)

### 버킷정책 권한 편집

아래처럼 권한을 수정해줍시다. 이때 유심하게 살펴볼 부분은 Principal 과 Resource 란입니다. Principal 은 \* 와일드타입으로 열어줘서, 외부에서 어디든 접근이 가능하도록 열어주는 것입니다.

또 Resource 부분에서는 [버킷 이름 + 특정 폴더] 해당 부분을 버킷 이름으로 수정해주면 됩니다. 또는 특정 폴더 경로까지 적어주면 되는데 저는 s3의 버킷 명만 적어주었습니다.

```java
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::[버킷 이름 + /특정 폴]/*"
        }
    ]
}
```

### 결과확인

버킷 설정이 끝났다면 다시 URL 로 이미지 데이터에 접근해봅시다. 그러면 아래처럼 정상적으로 접근되는 모습을 확인할 수 있습니다!

![](https://velog.velcdn.com/images/msung99/post/76203dc3-552f-4f68-aa59-cac5a631373b/image.png)

---

## 마치며

이렇게 AWS CloudFront, S3 에 기반한 CDN 환경을 어떻게 구축할 수 있을지에 대해 알아봤습니다. 다음 포스팅에서는 스프링부트 애플리케이션에 기반해 S3 스토리지에 어떻게 데이터를 업로드및 내려받을 수 있을지를 알아보겠습니다.

---

## 참고

[AWS 공식 가이드라인](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html)
[CloudFront OAI(origin access identity)를 통해 S3 버킷 콘텐츠에 대한 액세스](https://dev.classmethod.jp/articles/restrict-s3-access-through-cloudfront-oai/)
[What is Amazon CloudFront and How Does It Work?](https://medium.com/mindful-engineering/today-we-will-learn-about-cloudfront-690bf3a8819a)
[S3 이미지 올리고 url로 접근하기 (w. CloudFront)](https://velog.io/@ililil9482/S3-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%98%AC%EB%A6%AC%EA%B3%A0-url%EB%A1%9C-%EC%A0%91%EA%B7%BC%ED%95%98%EA%B8%B0-w.-CloudFront)
[Amazon CloudFront 오리진 액세스 제어(OAC)로 S3 오리진 보호하기](https://jirak.net/wp/amazon-cloudfront-%EC%98%A4%EB%A6%AC%EC%A7%84-%EC%95%A1%EC%84%B8%EC%8A%A4-%EC%A0%9C%EC%96%B4oac%EB%A1%9C-s3-%EC%98%A4%EB%A6%AC%EC%A7%84-%EB%B3%B4%ED%98%B8%ED%95%98%EA%B8%B0/)

.
