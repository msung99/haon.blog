---
title: 어노테이션 기반 Redis 캐싱
date: "2023-06-16"
tags:
  - Redis
  - 캐싱
previewImage: redis.png
---

## RedisConfig

지난 내용과 대부분 유사한 테스트 코드를 짜봤습니다. 로컬 캐시를 Redis 기반의 글로벌 캐시로 바꿨다는점이 이번 내용의 가장 핵심이자 지난 내용과의 차이점이 될것입니다. 즉, `ConcurrentHashMap` 에서 `RedisCache` 로 전환하는 것이 이번 내용입니다.

### redis 포트 설정

docker 를 이용해 redis 를 간단히 띄웠으며, 6379 포트로 지정해줬습니다.

```java
spring.data.redis.host=localhost
spring.data.redis.password=1234
spring.data.redis.port=6379
```

### RedisConfig 전체코드

Redis Cache를 적용하기 위해, `RedisCacheManager` 및 `RedisConnectionFactory` 를 등록해주면 Redis 캐시 설정이 완료됩니다. 아래 전체 코드를 일부 단위로 몇개씩 끊어서 상세히 설명해보겠습니다.

```java
@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisport;

    @Bean
    public LettuceConnectionFactory connectionFactory() {
        return new LettuceConnectionFactory(redisHost, redisport);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(){
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory());
        redisTemplate.setDefaultSerializer(new GenericJackson2JsonRedisSerializer());
        return redisTemplate;
    }

    @Bean
    public CacheManager redisCacheManager(){
        RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        RedisCacheManager redisCacheManager = RedisCacheManager.RedisCacheManagerBuilder
                .fromConnectionFactory(connectionFactory())
                .cacheDefaults(redisCacheConfiguration)
                .build();

        return redisCacheManager;
    }
}
```

### @Configuration 등록

```java
@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisport;
```

우선 해당 클래스가 스프링의 구성 클래스임을 나타냈습니다. 어려운 내용은 아니므로, 자세한 설명은 생략하겠습니다.

### LettuceConnectionFactory 생성

```java
@Bean
public LettuceConnectionFactory connectionFactory() {
  return new LettuceConnectionFactory(redisHost, redisport);
}
```

`LettuceConnectionFactory` 를 생성하여 Redis와의 연결을 설정하는 빈(Bean)입니다. redisHost와 redisPort 값을 사용하여 LettuceConnectionFactory를 구성하고 반환합니다. `LettuceConnectionFactory` 는 Redis와의 연결을 관리하기 위한 Spring Data Redis의 연결 팩토리(Factory) 클래스로, Redis 데이터베이스와의 통신을 처리합니다.

### redisTemplate 생성을 위한 Bean

```java
@Bean
public RedisTemplate<String, Object> redisTemplate(){
  RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
  redisTemplate.setConnectionFactory(connectionFactory());
  redisTemplate.setDefaultSerializer(new GenericJackson2JsonRedisSerializer());
  return redisTemplate;
}
```

Redis 와 상호작용하기 위한 주요 클래스로써 RedisTemplate 를 활용하기위해, RedisTemplate 을 생성하는 빈을 선언했습니다. 앞서 connectionFactory( ) 메소드에서 생성한 `LettuceConnectionFactory` 를 RedisTemplate 와 연결하도록 했습니다. 또한, `GenericJackson2JsonRedisSerializer` 를 기본 직렬화기로 설정해서 객체를 JSON 형식으로 직렬화하여 Redis 에 저장하는데 사용되도록 했습니다.

### RedisCacheManager 생성을 위한 Bean

```java
@Bean
public CacheManager redisCacheManager(){
  RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        RedisCacheManager redisCacheManager = RedisCacheManager.RedisCacheManagerBuilder
                .fromConnectionFactory(connectionFactory())
                .cacheDefaults(redisCacheConfiguration)
                .build();

        return redisCacheManager;
    }
```

RedisCacheManager를 생성하는 빈입니다. `RedisCacheConfiguration` 을 설정하고, connectionFactory() 메서드에서 생성한 `LettuceConnectionFactory` 와 연결하여 `RedisCacheManager` 를 구성합니다. 직렬화 설정으로는 `StringRedisSerializer` 를 키(key) 직렬화기로,`GenericJackson2JsonRedisSerializer` 를 값(value) 직렬화기로 사용합니다. 이 설정은 캐시된 데이터의 키와 값을 Redis에서 직렬화하고 역직렬화하는 데 사용됩니다.

참고로 Redis 에 객체를 저장할떄 이렇게 serializer 를 통해 직렬화 해줘야하는데, 이 직렬화 방법에는 다음과 같은 방법들이 있으니 참고바랍니다.

- Jackson2JsonRedisSerializer
- StringRedisSerializer
- GenericJackson2JsonRedisSerializer

---

## 스프링부트 코드

### BookController

테스트를 위한 코드들은 지난번과 거의 동일하다고 헀었습니다. 여기에 새롭게 컨트롤러 하나가 추가되었습니다. 문자열 하나를 쿼리스트링으로 받고, 이에대해 Service 단에서 캐싱을 진행하는 로직입니다.

```java
@Slf4j
@RestController
@RequestMapping("/book")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping("/data")
    public String getData(@RequestParam String param) throws InterruptedException {
        log.info("------- call Controller");

        long start = System.currentTimeMillis();
        String data = bookService.getBookById(param);
        long end = System.currentTimeMillis();

        log.info("------ controller time = {}", end - start);
        return data;
    }
}
```

### BookService

서비스단의 코드는 지난번과 매우 흡사하나, 파라미터와 리턴값만 조금 달리해봤습니다. String 을 받고, 이에 대한 캐싱을 진행하는 방식입니다.

```java
@Cacheable(value = "book")
    public String getBookById(String param) throws InterruptedException {
        System.out.println("Finding book" + param + " from databases...");
        Thread.sleep(5_000); // 데이터베이스 조회 쿼리가 5초 걸린다는 가정
        return param;
    }
```

---

## 실행결과

postman 을 통해 간단히 실행결과를 확인해봤습니다. 우선 애플리케이션 실행후 최초로 API 를 호출한 결과로, 아직 캐싱이 진행되지 않은 상태입니다. 오른쪽에 "Time" 란을 보면 86ms 라는 시간이 걸린것을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/956cdfbe-e0fa-40be-943f-2a65b56e1598/image.png)

다시한번 호출했을때 8ms 로 응답시간이 대폭 감소한 것을 볼 수 있습니다.
![](https://velog.velcdn.com/images/msung99/post/ba744e4d-a44a-479f-9201-0ec53e298278/image.png)

---

- https://liasn.tistory.com/5
- https://dev-setung.tistory.com/28
- https://souljit2.tistory.com/72
- https://velog.io/@bagt/Redis-역직렬화-삽질기-feat.-RedisSerializer
- https://velog.io/@mooh2jj/Redis-Cacheable-CacheEvict
- https://deveric.tistory.com/71
- https://velog.io/@qotndus43/Cache#스프링의-캐시-추상화
- ChatGPT
