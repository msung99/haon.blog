---
title: Redis 를 활용하여 Refresh 토큰 접근속도 개선하기
date: "2023-03-01"
tags:
  - Redis
  - 인증/인가
previewImage: redis.png
---

## 시작에 앞서

지난 [[Spring Security] Refresh Token, Access Token 을 활용한 로그인 관련 코드구현](https://velog.io/@msung99/Spring-Security-Refresh-Token-Access-Token-%EC%9D%84-%EC%BD%94%EB%93%9C%EB%A1%9C-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EC%9E%90) 에서도 설명드렸듯이, JWT 기반 인증/인가를 구현할때 DB 에 RefreshToken 을 저장할 수 있습니다.

이에 대한 실제 코드구현으로 [[Spring Security] Refresh token, Access token란? 기존 JWT 보다 탈취 위험성을 낮춰보자!](https://velog.io/@msung99/Spring-Security-Refresh-token-Access-token-%EB%9E%80-%EA%B5%AC%ED%98%84%EB%B0%A9%EB%B2%95%EC%9D%80) 이라는 포스팅을 따로 다루었죠. 그런데 아쉬운 문제점이 존재했습니다. **RefreshToken 을 발급한 이후, 별도의 로그아웃 API 호출이 없는경우 깔끔하게 토큰이 DB에서 삭제되지 못한다는 점입니다.**

---

## Redis 의 특징

[[Redis] CS 와 함께 뜯어보며 이해하는 Redis : 내부 구조와 동작원리에 대해](https://velog.io/@msung99/Redis-CS-%EA%B4%80%EB%A0%A8-%EC%A7%80%EC%8B%9D%EB%B6%80%ED%84%B0-%EB%9C%AF%EC%96%B4%EB%B3%B4%EB%A9%B0-%EC%9D%B4%ED%95%B4%ED%95%98%EB%8A%94-Redis-%EB%82%B4%EB%B6%80-%EA%B5%AC%EC%A1%B0%EC%99%80-%EB%A9%94%EC%BB%A4%EB%8B%88%EC%A6%98%EC%9D%84-%EC%82%B4%ED%8E%B4%EB%B3%B4%EC%9E%90) 에서도 설명했듯이, Redis 는 인메모리 데이터베이스로써 접근속도가 MySQL 과 같은 일반 데이터베이스에 비해 굉장히 빠르다는 장점이 있습니다.

다시 지난 내용을 정리해봅시다. Redis 는 key-value 데이터 쌍으로 관리할 수 있는 인메모리 데이터 스토리지입니다. In-memory 라는 특성때문에 Redis 는 저장된 데이터가 영속적이지 않고, 휘발성이라는 특징을 지닙니다.

보통 데이터베이스에 저장되는 데이터들은 HDD, SDD 같은 디스크에 저장되지만, Redis 는 RAM 에 저장하므로 데이터를 영구적으로 저장이 불가능한것이죠. 대신 빠른 접근속도를 보장받을 수 있는 것입니다. **빠른 접근속도, 휘발성이라는 특징으로 보통 캐시(Cache)의 용도로 Redis를 사용합니다.**

---

## 왜 Redis인가? : Redis vs RDB

Redis 는 리스트, 배열 형식의 데이터 처리에 특화되어있죠. 리스트 형 데이터의 입력과 삭제가 MySQL보다 10배 정도 빠릅니다.

이런 Redis 를 RefreshToken 의 저장소로 선택하면 정말 좋을겁니다. 빠른 접근 속도로 사용자가 로그인시(리프레시 토큰 발급시) 병목이 되지 않기 때문이죠.

또 Refresh Token 은 발급된 이후 일정시간 이후 만료가 되어야합니다.(보통 2주의 간격이죠?) 리프레시 토큰을 RDB 등에 저장하면, 스케줄러등을 사용해서 만료된 토큰을 주기적으로 DB 에서 제거해줘야합니다.

그러나 **Redis 는 기본적으로 데이터의 유효기간(time to live) 을 지정할 수 있습니다.** 이런 특징들이 바로 Refresh Token 을 저장하기에 적합한 특징들이죠.

또한 Redis 는 휘발성이라는 특징으로 인해 데이터가 손실될수도 있는 위험이 있으나, Redis 에 저장될 리프레시 토큰은 손실되더라도 그리 손해가 큰 편은 아닙니다. 기껏해봤자 RefreshToken 이 없어져서 다시 로그인을 시도해야 하는 정도이겠죠.

---

## gradle

build.gradle 파일을 통한 의존성 주입은 아래와 같이 진행해줬습니다. 유심히 살펴볼 부분은 redis, 토큰을 사용하기 위한 부분입니다.

```java
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
	implementation 'org.springframework.boot:spring-boot-starter-data-redis:2.3.1.RELEASE'

	implementation group: 'io.jsonwebtoken', name: 'jjwt-api', version: '0.11.2'
	implementation group: 'io.jsonwebtoken', name: 'jjwt-impl', version: '0.11.2'
	implementation group: 'io.jsonwebtoken', name: 'jjwt-jackson', version: '0.11.2'

	implementation 'org.springframework.boot:spring-boot-starter-data-jdbc'
	implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
	implementation 'org.springframework.boot:spring-boot-starter-data-redis'
	implementation 'org.springframework.boot:spring-boot-starter-jdbc'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	compileOnly 'org.projectlombok:lombok'
	runtimeOnly 'com.mysql:mysql-connector-j'
	annotationProcessor 'org.projectlombok:lombok'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

---

## Redis 환경 구성

### Redis 설치

Redis 를 스프링부트 애플리케이션에서 활용하려면, 우선 Redis 가 설치되어 있어야합니다. 저는 Docker 로 Redis 이미지를 내려받고, 컨테이너로 Redis 를 실행해주었습니다.

```java
$ docker pull redis  // 이미지 다운 (docker images 로 확인가능)
$ docker run --name my-redis -p 6379:6379 -d redis  // 컨테이너로 Redis 실행
```

추가적으로 Redis-cli 에 접속하고 싶다면 아래와 같이 진행해주세요.

```java
docker exec -it my-redis redis-cli
```

### yml 파일 host, port 구성

```java
spring:
  redis:
    host: localhost
    port: 6379
```

application.yml 에 host 와 port 를 설정해줍시다. localhost:6379 는 기본값이기 떄문에 만일 Redis 는 localhost:6379 로 띄웠다면 별도로 설정하지 않아도 연결이 되긴합니다.

하지만 일반적으로 운영 서버에서는 qufehdml host 포트번호를 사용하기 때문에, 위처럼 값을 별도로 셋팅하고 Configuration 에서 Bean 으로 등록해줍시다.

---

## 유저 서비스

### UserEntity

우선 유저에 대한 JPA 엔티티입니다. 간단하게 아이디(identification) 과 비밀번호(password) 로만 구성해줬습니다. 실무에서는 보안상 비밀번호를 base64 해싱을 진행하는등의 복호화 과정이 필요하겠지만, 이번에는 간단히 이런 세부 과정은 생략하겠습니다.

```java
@Entity
@Table(name = "User")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter @Setter @Builder
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int userIdx;

    @Column(unique = true)
    private String identification;
    private String password;
}
```

### UserController

사용자(유저) 에 대한 컨트롤러입니다. 실습은 위한 필수적인 API 만을 구성하도록, 회원가입과 로그인에 대한 API 만 개발해놓았습니다.

```java
@RequestMapping("/user")
@RestController
public class UserController {
    private final UserService userService;

    @Autowired
    public UserController(UserService userService){
        this.userService = userService;
    }

    @ResponseBody
    @PostMapping("/signUp")
    public BaseResponse createUser(@RequestBody SignUserReq signUserReq){
        try{
            userService.createUser(signUserReq);
            return new BaseResponse<>();
        } catch (BaseException baseException){
            return new BaseResponse(baseException.getStatus());
        }
    }

    @ResponseBody
    @PostMapping("/login")
    public BaseResponse<LoginUserRes> login(@RequestBody LoginUserReq loginUserReq){
        try{
            LoginUserRes loginUserRes = userService.login(loginUserReq);
            return new BaseResponse(loginUserRes);
        } catch (BaseException baseException){
            return new BaseResponse(baseException.getStatus());
        }
    }
}
```

### UserService

다음으로 User 에 대한 서비스 계층 코드입니다. UserRepository, JwtService 서비스 계층에 대한 의존성을 주입받고 앞서 살펴본 컨트롤러에게 기능을 제공해줍니다.

특히 눈여겨 볼 부분은 login 메소드입니다. 엑세스, 리프레시 토큰을 생성하고 응답값으로 넘겨주는 모습을 볼 수 있습니다.

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Autowired
    public UserService(UserRepository userRepository, JwtService jwtService){
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public void createUser(SignUserReq signUserReq) throws BaseException{
        try{
            UserEntity userEntity = signUserReq.toEntity();
            userRepository.save(userEntity);
        } catch (Exception exception){
            throw new BaseException(BaseResponseStatus.SERVER_ERROR);
        }
    }

    public LoginUserRes login(LoginUserReq loginUserReq) throws BaseException{
        try{
            UserEntity userEntity = userRepository.findUser(loginUserReq.getIdentification(), loginUserReq.getPassword());
            String accessToken = jwtService.createAccessToken(userEntity.getUserIdx());
            String refreshToken = String.valueOf(jwtService.createRefreshToken(userEntity.getUserIdx()));
            return new LoginUserRes(userEntity.getUserIdx(),accessToken, refreshToken);
        } catch (Exception exception){
            throw new BaseException(BaseResponseStatus.SERVER_ERROR);
        }
    }
}
```

---

## UserRepository

다음으로 유저 레포지토리입니다. Spring Data JPA 에서 제공해주는 레포지토리 인터페이스를 활용해 기본적인 레포지토티를 구성해습니다.

```java
@EnableJpaRepositories
public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    @Query("select m from UserEntity m where m.identification = :identification and m.password = :password")
    UserEntity findUser(@Param("identification") String identification, @Param("password") String password);
}
```

---

## Redis Client : Lettuce vs Jedis

스프링의 Redis Client 를 사용하는 방식에는 크게 Lettuce 와 Jedis 가 있습니다. 저희는 이번에 Lettuce 를 사용해보겠습니다.

원래는 Jedis 를 많이 사용해왔으나, 여러가지 단점 (멀티쓰레드 불안정, Pool 한계 등) 과 Lettuce 의 장점(Netty 기반이라 비동기 지원가능) 때문에 Lettuce 로 추세가 넘어가고 있습니다.

결국 Spring Boot 2.0 부터 Jedis 가 기본 클라이언트에서 deprecated 되고 Lettuce 가 탑재되었습니다.

**spinrg-boot-starter-data-redi**s 를 사용하면 별도의 의존성주입 없이 Lettuce 를 사용할 수 있습니다(아까 진행한 내용). 반면 Jedis 는 별도의 설정이 필요하죠.
저희는 고민할 필요가 없습니다. Lettuce 를 사용해봅시다.

---

## Redis Repository VS Redis Template

스프링에서 Redis 를 사용하는 방법은 2가지가 있습니다. 바로 Repository 인터페이스를 정의하는 방법과, Redis Template 을 사용하는 방법입니다.
저희는 이번에 2가지 방법 모두 사용해볼겁니다.

### Repository

Repository 인터페이스를 정의하는 방법은 Spring Data JPA 와 비슷합니다. Redis 는 많은 자료구조를 지원하는데, Repository 를 정의하는 이 방법은 Hash 자료구조로 한정하여 사용할 수 있습니다.
Repository 를 사용하면 객체를 Redis 의 Hash 자료구조로 직렬화하여 스토리지에 저장할 수 있습니다.

### RedisTemplate

RedisTemplate 은 Redis 서버에 명령어를 수행하기 위한 기능을 제공해줍니다.

---

## RedisHash 객체 클래스 정의

두 방법(Repository, RedisTemplate) 을 본격적으로 사용하기 전에, Redis 스토리지에 저장될 객체 클래스를 정의해야합니다. 아래와 같이 **@RedisHash 어노테이션**을 붙인 클래스가 레디스에 저장될 객체의 포맷이됩니다.

각 옵션에 대한 기능을 먼저 요약해보자면 아래와 같습니다.

> - @RedisHash 어노테이션 : Redis 에 저장할 자료구조인 객체를 정의

- value : Redis 의 keyspace 값으로 사용됩니다.
- timeToLive : 데이터의 생명주기 초 단위로 설정. 디폴트는 만료시간이 없는 -1L 입니다.
- @Id : 이 어노테이션이 붙은 필드가 Redis Key 값이 되며, Null 로 셋팅시 랜덤값이 설정됩니다.

---

- keyspace 와 합쳐져서 Redis 저장되는 최종 key 값은 **keyspace:id** 형태가 됩니다.

**timeToLive** 옵션, 즉 Redis 에 저장된 RefreshToken 데이터가 유지되는 시간(생명주기)은 1시간으로 정의해주었습니다. 실무에서는 1시간이 아닌 2주정도의 긴 시간으로 설정하겠지만, 이번에는 토큰이 스토리지에서 삭제되는 모습을 확인할 수 있도록 아래처럼 정의해 주었습니다.

또 **value** 옵션, 즉 Redis 의 keyspace 값은 "refreshToken" 으로 설정해주었습니다. 앞서 말씀드렸듯이, 이 value 에 지정한 값과 @Id 어노테이션을 붙인 refreshToken 필드의 값을 합쳐서 Redis 의 key 값으로 사용합니다.

예를들어 @Id 어노테이션이 붙은 refreshToken 필드의 값이 hi이면, 해당 데이터에 대한 Redis 의 key 값은 **refreshToken:hi** 가 됩니다.

```java
@RedisHash(value = "refreshToken", timeToLive = 3600)
public class RefreshToken {
    @Id
    private String refreshToken;
    private int userIdx;

    public RefreshToken(final String refreshToken, final int userIdx){
        this.refreshToken = refreshToken;
        this.userIdx = userIdx;
    }

    public String getRefreshToken(){
        return refreshToken;
    }

    public int getUserIdx(){
        return userIdx;
    }
```

---

## 1. Redis Repository

이제 본격적으로 Redis 를 활용해봅시다. 우선 2가지 방법중에 Redis Repository 를 사용하는 방법먼저 알아보겠습니다.

아래와 같이 CrudRepository 를 상속하고, 첫번째 타입에는 데이터를 저장할 객체의 클래스를, 두번째는 객체의 ID 값(@Id 어노테이션이 붙은) 타입 클래스를 넣어주면 됩니다. Spring Data JPA 와 비슷하죠?

```java
public interface RefreshTokenRepository extends CrudRepository<RefreshToken, String>{

}
```

CrudRepository 가 제공하는 메소드만을 사용해도 충분하므로, 별도의 메소드를 추가로 정의하지 않겠습니다.

### Redis Repository 의 특징

이렇게 Spring Data Redis 의 Redis Repository 를 활용하면 간단하게 **Domain Entity 를 Redis Hash 로 만들 수 있습니다.**

다만 트랜잭션을 이용하지 않기 때문에, **만일 트랜잭션을 적용하고 싶다면 RedisTemplate 을 사용해야합니다.**

### 사용방법

사용방법은 Spring Data JPA 를 사용할때와 동일합니다.

```java
@SpringBootTest
public class RedisRepositoryTest{
  @Autowired
  private RefreshTokenRepository refreshTokenRepository;

  @Test
  void test(){
    UserEntity user = new UserEntity("msung99", 1234);

    refreshTokenRepository.save(user); // 저장

    refreshTokenRepository.findById(user.getId()); //Redis 의 key 값을 기준으로 데이터 탐색
    // => 즉, "keyspace:Id" 값에 해당하는 데이터를 가져옴

    refreshTokenRepository.count(); // UserEntity 의 @RedisHash 에
    // 정의되어있는 keysapce (refreshToken) 에 속한 key 의 개수를 구함

    refreshTokenRepository.delete(user); // 삭제
  }
}
```

---

## 2. RedisTemplate

다음으로 RedisTemplate 으로 Redis 에 대한 Repository 를 정의하는 방법에 대해 알아보겠습니다.

### RedisConfig

RedisTemplate을 사용하기 위해서는 아래와 같이 **@Configuration**을 통해서 redisTemplate을 **스프링 Bean 으로 등록** 해야 사용가능합니다.

Redis 사용하기 위한 기본 Configuration 으로, application.yml 에 설정한 값을 @Value 어노테이션으로 주입해줍시다.

```java
@Configuration
public class RedisConfig {
    private final String redisHost;
    private final int redisPort;

    public RedisConfig(@Value("${spring.redis.host}") final String redisHost,
                       @Value("${spring.redis.port}") final int redisPort){
        this.redisHost = redisHost;
        this.redisPort = redisPort;
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory(){
        return new LettuceConnectionFactory(redisHost, redisPort);
    }

    @Bean
    public RedisTemplate<?, ?> redisTemplate(){
        RedisTemplate<byte[], byte[]> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory());
        return redisTemplate;
    }
}
```

### RefreshTokenRepository

RedisTemplate 에서는 앞서 살펴본 Redis Repository 방법처럼 인터페이스를 정의하지 않고, 직접 아래처럼 구현해야합니다.

```java
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Repository;
import redis.core.User.model.RefreshToken;

import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;


@Repository
public class RefreshTokenRepository {
    private RedisTemplate redisTemplate;
    public RefreshTokenRepository(final RedisTemplate redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    public void save(final RefreshToken refreshToken){
        ValueOperations<String, Integer> valueOperations = redisTemplate.opsForValue();
        valueOperations.set(refreshToken.getRefreshToken(), refreshToken.getMemberId());
        redisTemplate.expire(refreshToken.getRefreshToken(), 60L, TimeUnit.SECONDS);
    }

    public Optional<RefreshToken> findById(final String refreshToken){
        ValueOperations<String, Integer> valueOperations = redisTemplate.opsForValue();
        Integer userIdx = valueOperations.get(refreshToken);

        if(Objects.isNull(userIdx)){
            return Optional.empty();
        }
        return Optional.of(new RefreshToken(refreshToken, userIdx));
    }
}
```

### JwtService

**createAccessToken(), createRefreshToken()** 을 통해 토큰을 생성하도록 했습니다. 각 토큰의 만룍기간은 30분, 60분으로 설정했는데 실무였다면 refreshToken 의 경우 약 2주가량의 긴 시간이으로 설정했겠죠?

이 부분은 초반부에 언급한 UserService 서비스 부분에서 활용되는 부분이므로, 다시 되돌아가서 현재 코드와 함께 학습하시면 도움이 되실겁니다.

```java
@Service
public class JwtService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Autowired
    public JwtService(RefreshTokenRepository refreshTokenRepository){
        this.refreshTokenRepository = refreshTokenRepository;
    }


    public String[] createTokenWhenLogin(int userIdx){
        String refreshToken = createRefreshToken(userIdx);
        String accessToken = createAccessToken(userIdx);

        String[] tokenList = {refreshToken, accessToken};
        return tokenList;
    }


    public String createAccessToken(int userIdx){
        byte[] keyBytes = Decoders.BASE64.decode(Secret.ACCESS_TOKEN_SECRET_KEY);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        Date now = new Date();
        return Jwts.builder()
                .setHeaderParam("type","jwt")
                .claim("userIdx",userIdx)
                .setIssuedAt(now)
                .setExpiration(new Date(System.currentTimeMillis()+1*(1000*60*30))) // 만료기간은 30분으로 설정
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }


    public String createRefreshToken(int userIdx){
        byte[] keyBytes = Decoders.BASE64.decode(Secret.ACCESS_TOKEN_SECRET_KEY);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        Date now = new Date();
        String jwtToken =  Jwts.builder()
                .setHeaderParam("type","jwt")
                .claim("userIdx",userIdx)
                .setIssuedAt(now)
                .setExpiration(new Date(System.currentTimeMillis()+1*(1000*60*30))) // 만료기간은 1시간으로 설정
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        RefreshToken refreshToken = new RefreshToken(jwtToken, userIdx);
        // RefreshToken refreshToken = new RefreshToken(UUID.randomUUID().toString(), userIdx);
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getRefreshToken();
    }


    public String getAccessToken(){
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        return request.getHeader("Authorization");
    }


    public String getRefreshToken(){
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        return request.getHeader("RefreshToken");
    }
}
```

---

## 마치며

지금까지 인증/인가를 위한 JWT 토큰를 어떻게 더 성능을 개선할지에 대해 자세히 다루어봤습니다. 몰론 Redis 를 사용하지 않고도 RDB 만으로 충분히 인증 및 인가 시스템을 충분히 구현은 가능하지만, 저희의 목적은 말씀 드렸듯이 성능 개선입니다.

또 Redis 를 학습하시는 모든 분들에게 이 포스팅 내용이 큰 도움이 되셨으리라고 생각합니다. 최대한 열심히 적어본 포스팅이였네요!

---

## 참고

[Redis Document](https://redis.io/)
[[AWS]Redis란 무엇입니까?](https://aws.amazon.com/ko/elasticache/what-is-redis/)
[Redis는 왜 사용하는가?](https://yjam.tistory.com/50)
[Spring Boot 에서 Redis 사용하기](https://bcp0109.tistory.com/328)
[Spring Boot Redis 두 가지 사용 방법](https://wildeveloperetrain.tistory.com/32)
