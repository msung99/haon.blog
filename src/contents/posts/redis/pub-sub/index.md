---
title: 분산 환경에서 Redis Pub/Sub 메시지브로커를 활용한 로컬캐시 동기화
date: "2023-06-18"
tags:
  - Redis
  - pub/sub
  - 메시지브로커
---

## 글로벌 캐싱(Global Caching) 의 한계

[[Redis] RedisCacheManager 를 활용한 글로벌 캐싱(Global Caching)](https://velog.io/@msung99/Redis-RedisCacheManager-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-%EA%B8%80%EB%A1%9C%EB%B2%8C-%EC%BA%90%EC%8B%B1Global-Caching-favahclm) 에서 다루었듯이, 분산 환경에서 Redis 의 글로벌 캐싱을 활용하면 로컬 캐시에 대한 데이터 `일관성 문제` 를 해결 가능합니다. 그러나, Redis 와 같은 사설 저장소를 활용한다면 글로벌 캐싱도 문제점을 지닙니다. 우선 `네트워크 I/O 비용`은 절대 무시할 수 없을것입니다.

또한 캐시에 데이터를 저장하고 꺼내오는 I/O 과정에서 `직렬화(Serialization)` 와 `역직렬화(Deserialization)` 비용도 발생할 것입니다. 참고로 직렬화란 객체를 Redis 와 같은 메모리나 저장소에 객체를 저장하기 위해, 객체를 일렬로 나열된 바이트 형태로 변환하는 과정을 의미합니다. 반대로 역직렬화는 직렬화된 데이터를 다시 꺼내올때 객체로 변환하는 과정을 의미합니다.

이어서 최적화된 Response 를 제공하기 위해선 글로벌 캐시보다는 로컬 캐시를 사용하는 것이 훨씬 더 빠를겁니다. 로컬 캐시는 네트워크 I/O 비용 발생없이 해당 서버의 `지역성(locality)` 특성을 살려서 매우 빠른 속도로 데이터를 읽어오면 되기 때문입니다. 이 외에도 중앙회된 글로벌 캐시 서버를 사용시 발생하는 `단일 지점 문제(SPOF)` 와 같은 문제를 걱정하지 않아도 됩니다.

---

## Redis 의 Pub/Sub

![](https://velog.velcdn.com/images/msung99/post/8e71bc83-a38e-4794-9409-e3cd6da2478b/image.png)

Redis 에는 다양한 메시징 방법을 제공하는데, 그 중 대표적으로 `메시지 큐잉(Message Queueing)` 과 `Pub/Sub(Publisher-Subscriber)` 메시지브로커를 제공합니다. 메시지 큐잉은 Point-to-Point Channel 방식으로, 오로지 한 소비자만 메세지를 수신받는 방식으로 송신자와 수신자가 1:1 로 대응되어서 데이터를 수신받는 구조이죠.

반면 Pub/Sub 구조는 이벤트(메시지) 를 발생하는 Publisher 와 Subscriber 가 1:다 의 구조를 지닙니다. 이벤트(메시지)를 발생시켜서 특정 Channel(채널)에 브로드캐스트하는 `발행자(Pubisher)` 가 존재하며, 해당 `Channel(채널)` 을 구독하고 이벤트를 발급받는 여러 `구독자(Subscriber)` 가 존재합니다.

이러한 Pub/Sub 구조에서 Redis 의 채널은 이벤트를 저장하지 않는다는 비휘발성의 특징을 가지고 있습니다. 만약 Channel 에 이벤트가 도착했을때, 해당 채널의 구독자(Subscriber) 가 존재하지 않거나 그 구독자에 이상이 생겨서 이벤트를 발급받지 못하는 상황이라면, 이벤트는 자연스럽게 사라진다는 비휘발성의 특징이 있습니다. 또 구독자는 동시에 여러 Channel을 구독할 수있으며, 특정한 채널 이름을 명명하지 않고 '패턴'으로도 채널을 구독할 수 있습니다.

### 애플리케이션 서버의 Scale-Out 상황에서 Pub/Sub 적용

이렇게 Redis 의 Pub/Sub 기능을 Scale-Out(수평확장) 구조에서 활용해봅시다. **특정 애플리케이션 서버의 로컬 캐시가 갱신되었을 때, 해당 메시지(이벤트)를 다른 모든 서버에 브로드캐스트 하는 방식으로 여러 로컬 캐시를 동기화하는 방법입니다.**

이때 캐시가 갱신되었음을 알리고 이벤트를 발급하는 발행자(Publisher) 는 로컬캐시가 갱신된 서버입니다. 또, 그 로컬 캐시가 갱신된 사실을 브로드캐스트받는 구독자(Subscriber) 는 나머지 모든 애플리케이션 서버가 되는 구조인 것입니다. 브로드캐스트가 되면, 갱신된 캐시의 키를 메시지로 전달하는 방식입니다.

---

## 로컬캐시 동기화 구현하기

지금부터 스프링부트 애플리케이션에서 로컬캐시 동기화를 구현하는 코드를 직접 보여보겠습니다. 이 방식은 로컬 캐시에서 변경된 데이터만을 채널에 브로트캐스트 하는 방식이며, "Book" 이라는 클래스 객체를 캐시에 저장함을 가정했습니다.

---

## 기본 로컬캐싱 셋팅

### Book Entity

Book 은 아래와 같이 정말 간단하게만 구현했습니다. PK 와 책 이름 name 만을 저장합니다.

```java
@Entity
@AllArgsConstructor @NoArgsConstructor
@Setter @Getter
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
}
```

### LocalCacheConfig

```java
@EnableCaching
@Configuration
public class LocalCacheConfig {
    @Bean
    public CacheManager cacheManager(){
        return new ConcurrentMapCacheManager();
    }
}
```

지난번에는 글로벌 캐싱을 위해 RedisCacheManager 를 빈으로 등록해줬다면, 이번에는 간단히 캐시매니저로 간단히 `ConcurrentMapCacheManager` 를 사용했습니다. 각 서버의 로컬캐시에는 이 자료구조에 기반하여 Book 객체가 직렬화되어 캐싱될 것입니다.

### RedisConfig

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
    public RedisMessageListenerContainer RedisMessageListener(LettuceConnectionFactory lettuceConnectionFactory){
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(lettuceConnectionFactory);
        return container;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(){
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory());
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new Jackson2JsonRedisSerializer<>(Book.class));
        return redisTemplate;
    }
}
```

다음으로 Redis 와의 연결 및 `RedisMessageContainer` 와 `RedisTemplate` 을 활용하기 위한 설정정보를 담고있는 RedisConfig 클래스입니다. 기본적으로 Lettuce 를 활용하기위해 `LettuceConnectionFactory` 팩토리 메소드를 생성했습니다. 이 메소드 객체는 redis 와의 연결을 수행합니다.

또 `RedisMessageListenerContainer` 는 `구독자(Subsscriber)` 가 특정 `채널(토픽)` 을 구독하도록 만드는 역할을 수행하며, 추후 살펴볼 구독자 클래스의 `MessageListener` 인터페이스를 구현한 클래스인 RedisSubscriber 메시지 리스너를 등록하고 관리합니다. ( MessageListener 인터페이스를 구현한 클래스는 구독자가 됩니다.)

또한 이전에 다루었던 내용이지만 redisTemplate 을 등록하고, 활용할 팩토리 메소드와 직렬화 & 역직렬화할 데이터 타입을 명시해주고 있습니다. 위의 경우는 key 값을 문자열(String) 타입을, value 값을 JSON 타입을 직렬화해서 redis 에 저장함을 지정하고 있습니다. 여기서는 사용하지 않았지만, `setDefaultSerializer` 를 활용할 경우 key 와 value 에 대해 한꺼번에 직렬화 타입을 동일하게 명시할 수도 있음을 알아만둡시다.

### 추가적인 직렬화 방식

이번 주제와 조금 벗어날 수 있는 내용이므로 자세한 설명은 생략하겠지만, 직렬화를 가능한 타입은 다음과 같습니다.

- StringRedisSerializer, JdkSerializationRedisSerializer
- Jackson2JsonRedisSerializer, GenericJackson2JsonRedisSerializer
- OxmSerializer, ByteArrayRedisSerializer

이들을 활용하면 다양한 타입으로 직렬화가 가능하다고 하니, 자세한 내용은 공식문서를 참고합시다.

---

## Publisher & Subscriber 정의

### RedisPublisher

```java
@Service
public class RedisPublisher {
    private final RedisTemplate<String, Object> redisTemplate;

    public RedisPublisher(final RedisTemplate<String, Object> redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    public void publish(ChannelTopic topic, Book message){
        redisTemplate.convertAndSend(topic.getTopic(), message);
    }

}
```

Publisher 에 대한 정의 클래스입니다. `publish()` 를 보면 외부로부터 전달받은 채널(토픽) 에다가 Book 타입의 메시지를 발행하는 기능을 수행합니다. 이때 외부란 말이 햇갈릴 수 있는데, 아래와 같이 API 를 호출시 존재하는 Service 단의 메소드를 의미하는 것입니다. 그리고 RedisTemplate 의 내장 메소드인 `convertAndSend()` 을 통해서 실제로 Book 타입의 메시지를 Redis 에다 발행되는 메커니즘입니다.

```java
 @Transactional
public void updateBook(Book book) throws InterruptedException{
  // ... (업데이트 로직)
  // bookRepository.save(book);
  redisPublisher.publish(ChannelTopic.of("book-renewal"), book);
}
```

### RedisSubscriber

```java
@Service
public class RedisSubscriber implements MessageListener {
    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheManager cacheManager;

    public RedisSubscriber(final RedisTemplate<String, Object> redisTemplate,
                           final CacheManager cacheManager,
                           final RedisMessageListenerContainer redisMessageListener){
        this.redisTemplate = redisTemplate;
        this.cacheManager =cacheManager;

        ChannelTopic bookRenewalChannel = new ChannelTopic("book-renewal");
        redisMessageListener.addMessageListener(this, bookRenewalChannel);
    }

    @Override
    public void onMessage(final Message message, final byte[] pattern){
        byte[] body = message.getBody();
        Book book = (Book) redisTemplate.getValueSerializer().deserialize(body);
        cacheManager.getCache("book").evict(book);
    }
}
```

이어서 Subscriber 에 대한 정의 클래스입니다.다른 애플리케이션에서 메시지가 발행되었을 때, 정해진 명령을 실행하는 구독자입니다. 앞서 `RedisConfig` 클래스의 설명을 잘 읽었다면 `MessageListener` 인터페이스를 구현했다는 것을 볼 수 있는데, MessageListener 를 구현한 RedisSubscriber 클래스는 `메시지 리스너` (= 메시지를 전달받는자)로 등록되고 관리됩니다. 정확히는 `onMessage()` 메소드를 오버라이드하고 활용하기 위해 인터페이스를 구현한 것입니다.

#### OnMessage()

`onMessage()` 메소드는 메시지가 발행되었을때 자동으로 호출되는 메소드입니다. `MessageListener` 를 구현한 클래스가 메소드가 발행되었을때 어떤 행동을 취할지 이 메소드 안에 정의해주면 됩니다. 저는 이번 메소드가 발행되었을때 위처럼 **CacheManager를 사용하여 "book" 캐시에서 변경이 발생한 캐시를 무효화(invalidation)하는 로직**을 정의해줬습니다. 즉, 이 메소드를 수행한 모든 Subscriber 서버의 로컬캐시의 데이터는 삭제(= evict) 되는 것입니다.

#### 캐시 무효화란?

캐시의 무효화란 캐시에서 갱신된 특정 데이터를 캐시에서 삭제하는 행위를 의미한다고 보면 됩니다. 즉, 캐시 무효화가 수행된 구독자 서버들은 해당 데이터를 조회하는 API 를 다음에 호출할때는 데이터베이스로부터 새롭게 조회해와야 합니다. 그리고 그 가져온 새로운 데이터를 캐시에 write 함으로써 로컬캐시의 데이터가 최신화 되는 것입니다.

#### RedisMessageListenerContainer

`RedisMessageListenerContainer` 는 특정 토픽 또는 채널을 구독하는 역할을 수행하며, MessageListener 구현한 클래스인 RedisSubscriber 메시지 리스너에게 새로운 채널을 등록하고 관리하도록 도와주는 역할을 수행합니다. 그래서 위 코드의 생성자를보면, "book-renewal" 이라는 새로운 채널을 Subscriber 에게 만들어주는 역할을 수행하는걸 볼 수 있습니다.

---

## 스프링부트 애플리케이션 API 코드

### BookController

```java
@Slf4j
@RestController
@RequestMapping("/book")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping("/data")
    public Book getBookInfo(@RequestParam String param) throws InterruptedException {
        Book book = bookService.getBookInfo(param);
        return book;
    }

    @PostMapping("/data")
    public void updateBookInfo(@RequestParam String param) throws InterruptedException{
        bookService.updateBook(param);
    }
}

```

위와 같이 Book 객체에 대해 조회 및 수정이 가능한 API 2개를 정의했습니다.

---

### BookService

```java
@Service
public class BookService {
    private final BookRepository bookRepository;
    private final RedisPublisher redisPublisher;

    @Autowired
    public BookService(BookRepository bookRepository, RedisPublisher redisPublisher){
        this.bookRepository = bookRepository;
        this.redisPublisher = redisPublisher;
    }

    @Cacheable(value = "book")
    @Transactional(readOnly = true)
    public Book getBookInfo(String param) throws InterruptedException {
        System.out.println("Finding book" + param + " from databases...");
        Book book = bookRepository.findByName(name);
        System.out.println("Get Complete!");

        return book;
    }

    @Transactional
    public void updateBook(String name) throws InterruptedException{
        // ... (업데이트 로직)
        Book book = bookRepository.findByName(name);
        book.setName(name);
        bookRepository.save(book);
        redisPublisher.publish(ChannelTopic.of("book-renewal"), book);
    }
}
```

#### getBookInfo

우선 `@Cacheable` 어노테이션을 통해 캐시에 없는 데이터에 대해 캐싱하도록 처리했습니다. 이 메소드의 리턴타입인 Book 이 로컬캐시에 저장되도록 했는데, 이 타입을 잠깐 유의해서 보면 앞서 RedisConfig 에서 살펴본 직렬화 타입과도 매칭합니다.

```java
redisTemplate.setKeySerializer(new StringRedisSerializer());
redisTemplate.setValueSerializer(new Jackson2JsonRedisSerializer<>(Book.class));
```

이렇게 key, value 에 대한 직렬화 타입을 명시해줬는데, 여기서 key 값에는 "book" 이 저장되며, "value" 로는 Jackson JSON 라이브러리를 사용하여 Book 객체를 JSON 형식으로 직렬화하여 저장하는 것입니다. 역직렬화도 동일한 타입으로 수행됩니다.

#### updateBook

```java
redisPublisher.publish(ChannelTopic.of("book-renewal"), book);
```

앞서 RedisPublisher 클래스에서 정의한 `publish()` 메소드를 통해 "book-renewal" 이라는 채널에 book 객체라는 메시지를 발행하는 모습입니다.

참고로 이 메소드는 리턴타입으로 void 타입을 명시해줬는데, 별도의 리턴타입을 굳이 명시할 필요가 없었기 때문입니다. 그저 Redis 서버의 "book-renewal" 이라는 채널에 메시지를 잘 전달하고, Subscriber 서버는 로컬캐시에서 `캐시 무효화` 작업만 잘 수행해주면 됩니다.

---

## 실행결과

여러 서버에 요청을 여러번 보내고 데이터 수정 요청을 보내도, 로컬 캐시가 잘 동기화되어 일관성 문제를 해결할 수 있었습니다. 또한 캐시의 특성을 살려서 평균 `28ms` 이라는 매우 빠른 속도로 데이터를 조회할 수 있게 되었습니다 🙂

---

## 더 학습해야할 키워드

- Spring Data Redis : MessageListener, RedisMessageListenerContainer, RedisConnectionFactory
- 직렬화/역직렬화
- Kafka
- Producer/Consumer

---

## 참고

- https://brunch.co.kr/@springboot/557
- https://blog.naver.com/ds4ouj/222801168888
- https://github.com/spring-projects/spring-data-redis/releases/tag/3.0.0-M4
- https://pompitzz.github.io/blog/Redis/LocalCacheSyncWithRedisPubSub.html#redis-pub-sub
- https://www.baeldung.com/pub-sub-vs-message-queues
- https://medium.com/frientrip/pub-sub-%EC%9E%98-%EC%95%8C%EA%B3%A0-%EC%93%B0%EC%9E%90-de9dc1b9f739
