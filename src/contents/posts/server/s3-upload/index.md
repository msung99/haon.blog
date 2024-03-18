---
title: AWS S3 에 스프링부트 파일 업로드 하기
date: "2023-02-09"
tags:
  - AWS
previewImage: server.png
---

## IAM 계정 발급 및 accessKey 생성

### IAM 계정 생성

본격적인 API 개발이전에 사전 준비물이 있습니다. 바로 AWS 에서 S3 버킷 접근 권한을 가진 IAM 계정을 하나 생성하는 것입니다. 또 해당 계정에 대해 accessKey 과 secretKey 를 발급받아야 합니다.

IAM 을 검색하고 아래와 같이 계정을 하나 생성해줍시다. 저는 이미 springboot-s3 라는 계정을 하나 생성한 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/85f9afab-b339-40a8-8e3e-5419fcb440ef/image.png)

과정을 간단히 나열해보자면 다음과 같습니다. 우선 사용자 이름을 설정하신다면 아래와 같은 페이지로 넘어오게 됩니다. 여기서 권한 옵션을 "직접 정책 연결"을 선택하시고, 말그대로 직접 권한정책을 지금 생성할 IAM 계정에 대해서 지정해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/7d00b036-4ff7-41d6-8f4d-de09d48c3851/image.png)

다음처럼 권한 정책을 검색하면 지정해주시면 되는데, S3 와의 원활한 연동을 진행하기 위해선 "IAMFullAccess" 와 "AmazonS3FullAccess" 정책을 선택해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/9487e9bb-2cd5-4acf-8e83-fcbefbb0adf4/image.png)

결과적으로 IAM 계정 생성 완료후 선택한 정책을 조회해보면 아래와 같이 나오게됩니다.

![](https://velog.velcdn.com/images/msung99/post/3365f619-488d-4550-aaa7-f119fa553092/image.png)

---

### accessKey 활성화(발급)

방금 생성한 IAM 계정을 조회해보시면 엑세스 키(accessKey) 가 아래와 같이 활성화되지 않은 모습을 확인할 수 있습니다.

추후 스프링부트 애플리케이션에서 IAM 계정에 기반한 엑세스 키를 활용해서 S3 에 파일을 읽고 쓰는 작업을 진행할 것인데, 엑세스 키가 활성화 되지 않으면 S3 에 대한 접근권한이 없어서 작업 진행이 안됩니다. 따라서 엑세스 키를 활성화해줘야 합니다.

![](https://velog.velcdn.com/images/msung99/post/6a5792f7-4ad3-4ef0-a675-aedad7cfe918/image.png)

"보안 자격 증명" 란을 택하면 아래처럼 엑세스 키를 생성할 수 있게 나오는데 생성을 해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/e37c07e8-c275-4d5a-a3a2-f24d989d46e1/image.png)

엑세스 키를 생성하면 아래와 같이 발급받을 수 있게 되는데, 이때 시크릿키(비밀 엑세스 키) 의 경우에는 지금 발급받은 직후로는 다시 조회가 불가능하니, 따로 메모를 해두시거나 csv 파일을 다운받으시는걸 권장 드립니다.

![](https://velog.velcdn.com/images/msung99/post/79e48453-289e-42cf-88f9-0ed3f8a9d3b1/image.png)

---

## 스프링부트 애플리케이션 & S3 연동

### spring cloud 의존성 추가

이제 본격적으로 스프링부트 애플리케이션 코드 작성을 시작해봅시다. 우선 spring cloud AWS 외부 라이브러리를 활용해서 쉽게 S3 를 통한 파일 업로드 기능을 구현해볼겁니다.

```java
//  build.gradle
implementation 'org.springframework.cloud:spring-cloud-starter-aws:2.2.6.RELEASE'

```

### yml 파일구성

또 application.yml 파일에서 앞서 IAM 생성했던 계정 정보와 access & secret Key 를 등록해줍시다. 이 설정정보에 기반하여 spring cloud 라이브러리를 활용해 s3 버킷에 파일을 업로드하는 것이죠.

또 기본적으로 Multipart 로 보낼수 있는 파일의 최대크기의 default 값은 1MB 입니다. 사진이 1MB 가 넘을 수도 있다는 점을 감안하여, 아래와 같이 10MB 로 최대크기를 다시 지정해줬습니다.

```java
// applcation.yml
cloud:
  aws:
    credentials:
      access-key: AWIUEJWQIUWJEJIOWJIO  // IAM 계정의 accessKey
      secret-key: BqwulzzZqiZw+wwW0ifeweqDmiz+LfAlp  // IAM 계정의 secretKey
    region:
      static: ap-northeast-2  // 버킷의 리전
    s3:
      bucket: my-bucket   //  버킷 이름
    stack:
      auto: false

spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
```

---

### Config 파일

S3 용 config 파일을 생성후, 앞서 yml 파일에서 만든 설정정보에 기반하여 자세한 설정을 진행해주는 것입니다.

- 현재 작업(읽기,쓰기,삭제 등등)하려는 파일의 경우 AWS S3 에 접근시 어떤 IAM 계정으로 접근하며, 어떤 region 과 accessKey, secretKey 로 접근하는지를 명시하는 것이죠.
  이에 관한것을 amazonS3Client 라는 이름을 가진 스프링빈으로 관리하는 것입니다.

- @Value 어노테이션의 모든 변수 값들에는 application.yml 에서 기제한 내용에 기반하여 값이 할당되는 것입니다.

참고로 Spring Boot Cloud AWS를 사용하면 AmazonS3Client와 같은 S3 관련 Bean들이 자동 생성됩니다. 즉 여기서는 AmazonS3Client 라는 스프링빈을 재정의한것이죠.

```java
@Slf4j
@Configuration
public class AwsS3Config {
    @Value("${cloud.aws.credentials.access-key}") // application.yml 에 명시한 내용
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region.static}")
    private String region;

    @Bean
    public AmazonS3Client amazonS3Client() {
        BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);
        return (AmazonS3Client) AmazonS3ClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                .build();
    }
}
```

---

## 스프핑부트 애플리케이션 API 코드

### AmazonS3Controller

이번 포스팅의 가장 핵심인 API 코드 내용입니다. 저는 업로드, 삭제 2가지 기능을 구현했으며, 업로드 기능은 한번에 여러개의 파일 업로드 가능하도록 구현했으며, 삭제는 하나만 삭제 가능하도록 구현했습니다.

uploadFile 의 경우 인풋으로 MultipartFile 을 받아오지만, deleteFile 의 경우는 파일이름에 기반하여 S3 에 올라가있는 파일을 삭제를 한다는 점에 유의합시다.

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/file")
public class AmazonS3Controller {

    private final AwsS3Service awsS3Service;

    @PostMapping("/uploadFile")
    public ResponseEntity<List<String>> uploadFile(List<MultipartFile> multipartFiles){
         return ResponseEntity.ok(awsS3Service.uploadFile(multipartFiles));
    }

    @DeleteMapping("/deleteFile")
    public ResponseEntity<String> deleteFile(@RequestParam String fileName){
        awsS3Service.deleteFile(fileName);
        return ResponseEntity.ok(fileName);
    }
}
```

### AwsS3Service

다음으로는 Service 단입니다. 여기서 실질적으로 S3에 파일을 업로드하거나 삭제하는 요청들이 일어나는 것이죠.

```java
@Service
@RequiredArgsConstructor
public class AwsS3Service {
    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;

    public List<String> uploadFile(List<MultipartFile> multipartFiles){
        List<String> fileNameList = new ArrayList<>();

        // forEach 구문을 통해 multipartFiles 리스트로 넘어온 파일들을 순차적으로 fileNameList 에 추가
        multipartFiles.forEach(file -> {
            String fileName = createFileName(file.getOriginalFilename());
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentLength(file.getSize());
            objectMetadata.setContentType(file.getContentType());

            try(InputStream inputStream = file.getInputStream()){
                amazonS3.putObject(new PutObjectRequest(bucket, fileName, inputStream, objectMetadata)
                        .withCannedAcl(CannedAccessControlList.PublicRead));
            } catch (IOException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.");
            }
            fileNameList.add(fileName);

        });

        return fileNameList;
    }

    // 먼저 파일 업로드시, 파일명을 난수화하기 위해 UUID 를 활용하여 난수를 돌린다.
    public String createFileName(String fileName){
        return UUID.randomUUID().toString().concat(getFileExtension(fileName));
    }

    // file 형식이 잘못된 경우를 확인하기 위해 만들어진 로직이며, 파일 타입과 상관없이 업로드할 수 있게 하기위해, "."의 존재 유무만 판단하였습니다.
    private String getFileExtension(String fileName){
        try{
            return fileName.substring(fileName.lastIndexOf("."));
        } catch (StringIndexOutOfBoundsException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일" + fileName + ") 입니다.");
        }
    }


    public void deleteFile(String fileName){
        amazonS3.deleteObject(new DeleteObjectRequest(bucket, fileName));
        System.out.println(bucket);
    }
}
```

위 코드에서 핵심적인 코드들만 잠깐 짚어봅시다.

#### 1. createFileName

이때 createFileName 을 보시면 UUID 를 활용한 모습을 볼 수 있습니다.
S3 에 같은 이름의 파일을 업로드하게 된다면 먼저 업로드된 파일이 나중에 업로드한 파일로 덮어씌어지는 문제가 발생합니다. 이를 해결하도록 S3 에는 실제 파일명이 아닌 별도의 파일 이름으로 저장하기위해 UUID 를 활용한 것입니다.

#### 2. withCannedAcl 메소드

이 메소드를 통해 업로드한 파일을 모두가 읽을 수 있게 설정합니다.

#### 3. objectMetadata.setContentLength(file.getSize());

ObjectMetadata 객체에 content-length를 지정하지 않으면 warning 로그가 발생합니다.

---

## API 테스트

아래와 같이 uploadFile API 를 요청하면 Response 로 업로드한 파일명이 리턴되는 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/0af01794-b0a4-4b54-a25a-3b27004bb2b6/image.png)

S3 에서도 조회해보면 파일 여러개가 정상적으로 업로드된 모습을 확인할 수 있습니다!

![](https://velog.velcdn.com/images/msung99/post/1d3c95ad-5cd6-4b9d-83fb-948f8acae51c/image.png)

---

## 마치며

지금까지 IAM 계정을 생성 및 엑세스&시크릿 키를 발급하고, 스프링부트 애플리케이션에서 Spring Cloud 를 활용해 다중 파일을 업로드 및 삭제하는 API 를 구현하는 방법에 대해 알아봤습니다. 다소 긴 내용의 포스팅이였으나 끝까지 읽어주신 모든 분들이 많은 내용을 얻어갔으면 하는 포스팅이네요 🙂

---

## 참고

[Spring Cloud Docs](https://spring.io/projects/spring-cloud)
[Aws Documentation : IAM 사용자의 액세스 키 관](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/id_credentials_access-keys.html)
[아마존 웹 서비스 IAM 사용자의 액세스 키 발급 및 관리](https://www.44bits.io/ko/post/publishing_and_managing_aws_user_access_key)
[AWS Access Key 생성하기](https://jhleeeme.github.io/create-access-key-in-aws/)
[Spring Boot와 S3를 연동한 파일 업로드](https://velog.io/@louie/S3%EB%A5%BC-%EC%97%B0%EB%8F%99%ED%95%9C-%ED%8C%8C%EC%9D%BC-%EC%97%85%EB%A1%9C%EB%93%9C#%EC%8A%A4%ED%94%84%EB%A7%81-%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C-%EC%9D%98%EC%A1%B4%EC%84%B1-%EC%B6%94%EA%B0%80)
[[스프링] AWS S3에 이미지 업로드 하기](https://leveloper.tistory.com/46)
[[SpringBoot] SpringBoot 를 활용한 AWS S3에 파일 업로드 구현](https://earth-95.tistory.com/117#AwsS-Service-java)
[SpringBoot & AWS S3 연동하기](https://jojoldu.tistory.com/300)
