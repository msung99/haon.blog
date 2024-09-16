---
title: 격리된 테스트(Isolated Test) 구축과 빌드 최적화 - 이론편 
date: "2024-08-20"
tags:
  - Spring
  - 테스트
previewImage: test.png
---

## 이론편

우리 카테부 하모니 팀에서는 견고한 애플리케이션 구축을 위해 테스트 전략을 수립하고, 다양한 테스트 코드를 작성하고 있다. 이 과정속에서 우리 팀 백엔드 애플리케이션 테스트 환경을 가장 괴롭혔던 키워드가 바로 `테스트 격리` 이다. 

테스트 격리란 무엇인가? 그리고 이는 무엇이길래 우리 팀의 테스트 환경 구축을 어렵게 만들었을까? 이를위해, 우선 테스트 격리가 무엇인지에 대해 자세히 다루어보고자 한다. 이번 포스팅에선 테스트 격리의 이론편을 구성하고, 다음 포스트에선 우리 팀에서 마주한 테스트 격리 관련 트러블슈팅을 실전편으로 다루어보겠다.

## 격리되지 않은 테스트의 문제점

우리가 작성한 여러 테스트들은 실행 순서에 상관없이 각기 독립적으로 수행되어야 한다. 즉, 각 테스트는 독립적으로 "격리된" 환경속에서 서로에게 영향을 미치지 않고 수행되어야 한다. 하지만, 데이터베이스와 같이 공유 자원을 사용하는 테스트들은 **실행 순서에 따라 성공, 실패 여부가 결정되는 비결정적(Non-Deterministic) 테스트** 가 될 수 있다. 

비결정적 테스트(Non-Deterministic)란 같은 입력값에 대해 항상 같은 결과를 보장하지 않는 테스트를 뜻한다. 또한 이 비결정적 테스트가 발생하는 원인은 테스트 격리가 부족하게 될 때 발생하는 것이다. 가령 아래의 테스트를 살펴보자.

~~~java
@SpringBootTest
public class MemberServiceTest {

    @Autowired
    private MemberService memberService;

    @DisplayName("멤버를 저장한다.")
    @Test
    void test1() {
        // given
        String email = "devHaon@kakao.com";

        // when, then
        assertDoesNotThrow(() -> memberService.save(email));
    }
    
    @DisplayName("멤버 정보가 없으면 예외가 발생한다.")
    @Test
    void test2() {
        // given
        String email = "devHaon@kakao.com";

        // when, then
        assertThatThrownBy(() -> memberService.finByEmail(email))
          .isInstanceOf(NoExistMember.class);
    }
}
~~~

첫번째 테스트는 두번째 테스트에 아무런 영향을 끼치지 않을까? 만약 test1 을 수행 후 test2 를 수행하면, 아쉽게도 첫번째 테스트는 의도치 않게 두번째 테스트에 영향력을 행사하게 되어 실패한다. 반면 test2 만을 싫행하면, 신가하게도 테스트는 성공한다. **이것이 바로 비결정적 테스트이며, 테스트 격리가 부족하여 발생한 상황이다.**

### 테스트 격리의 필요성

테스트 격리는 **공유 자원을 사용하는 여러 테스트끼리 격리시켜서 서로 영향을 주고 받지 못하게 하는 기법**이다. 공유 자원이라 함은, 대표적으로 데이터베이스가 해당한다. 데이터베이스를 사용하는 스프링 객체를 테스트할 때 테스트 격리는 반드시 필요하다.

## 스프링부트 애플리케이션에서 테스트를 격리하는 방법

격리된 테스트 환경을 구축하지 않을 경우 발생하는 문제점과, 테스트 격리가 왜 필요한지에 대해 살펴봤다. 그렇다면 스프링부트 애플리케이션에서 효과적으로 테스트를 격리하는 방법으로 어떤 방법이 있는지 학습해보도록 하자.

### @Transactional

가장 먼저 떠올릴 수 있는 방법은 스프링부트에서 제공하는 `@Transactional` 어노테이션으로 각 테스트를 트랜잭션 단위로 처리하는 방식이다. 각 테스트가 실행된 후 매번 롤백을 시킨다면 다음 테스트에 영향을 끼치지 않으리란 가정을 깔고 격리시키는 기법이다. **하지만, 아쉽게도 @Transactional 기반 트랜잭션 롤백하는 전략은 E2E 테스트, 인수 테스트 등에서는 사용할 수 없다.** 다시말해, 테스트 종류에 따라 격리가 불가능한 케이스가 존재한다.

`@Transactional` 어노테이션을 명시하여 트랜잭션을 끝난 뒤 롤백되는 것은 자명한 사실이다. 하지만, E2E, 인수 테스트 등 전 구간 테스트는 `@SpringBootTest` 어노테이션에 port 를 지정하여 서버를 띄우게 되는데, 이때 HTTP 클라이언트와 서버는 각각 다른 쓰레드에서 실행된다. **즉, @Transactional 어노테이션이 있다고 한들 호출되는 쪽은 다른 쓰레드에서 새로운 트랜잭션으로 커밋하기 때문에 롤백 전략이 무의미해진다.**

~~~java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = TestConfig.class)
@ActiveProfiles("test")
public abstract class AcceptanceTestConfig {
    @LocalServerPort
    private int port;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        databaseCleaner.clear();
    }
}
~~~

위는 실제 우리 하모니 팀 인수 테스트를 위한 추상 클래스인데, 보듯이 `@SpringBootTest` 내에 포트를 지정하고 있다. 우리 팀 또한 인수 테스트를 작성하고 있기 때문에, `@Transactional` 기반 롤백 전략보다 더 효과적인 격리 기법이 필요하다고 판단했다.

### @DataJpaTest, @JdbcTest

다음으로 영속성 레이어 관련 테스트 (Dao, Repository 등) 을 테스트할 때 테스트를 격리시키는 방법이다. 이는 `@DataJpaTest` 와 `@JdbcTest` 어노테이션을 통해 테스트 격리 환경을 구축하는 방법이다. 이번에 테스트 격리에 대해 학습하면서 처음 알게된 사실인데, 이 어노테이션에선 테스트 격리를 보장하고 있었다는 점이다. 여지껏 하모니 팀에서 영속성 계층 테스트 코드를 작성시 별 생각없이 `슬라이스 테스트(Slice Test)` 만을 위해 이 어노테이션들을 사용했는데, 반성해야겠다. 

아래에 실제 하모니 팀 프로젝트에서 작성한 테스트 코드 중 일부를 가져와봤다.

~~~java
public class MemberLiveInformationRepositoryTest extends RepositoryTestConfig {
    @Autowired
    private MemberLiveInformationRepository memberLiveInformationRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private LiveInformationRepository liveInformationRepository;

    @DisplayName("멤버의 생활정보를 찾는다.")
    @Test
    void 멤버의_생활정보를_찾는다() {
        // given
        Member 하온 = memberRepository.save(하온_기존());

        LiveInformation 생활정보1 = liveInformationRepository.save(new LiveInformation("생활정보1"));
        LiveInformation 생활정보2 = liveInformationRepository.save(new LiveInformation("생활정보2"));

        MemberLiveInformation memberLiveInformation1 = new MemberLiveInformation(생활정보1, 하온);
        MemberLiveInformation memberLiveInformation2 = new MemberLiveInformation(생활정보2, 하온);
        List<MemberLiveInformation> memberLiveInformations = new ArrayList<>(List.of(memberLiveInformation1, memberLiveInformation2));
        memberLiveInformationRepository.saveAll(memberLiveInformations);

        // when, then
        assertThat(memberLiveInformationRepository.findByMemberId(하온.getId())).hasSize(2);
    }

    @DisplayName("멤버의 생활정보를 삭제한다.")
    @Test
    void 멤버의_생활정보를_삭제한다() {
        // given
        Member 하온 = memberRepository.save(하온_기존());

        LiveInformation 생활정보1 = liveInformationRepository.save(생활정보1_생성());
        LiveInformation 생활정보2 = liveInformationRepository.save(생활정보2_생성());

        MemberLiveInformation 멤버_생활정보1 = new MemberLiveInformation(생활정보1, 하온);
        MemberLiveInformation 멤버_생활정보2 = new MemberLiveInformation(생활정보2, 하온);
        memberLiveInformationRepository.saveAll(List.of(멤버_생활정보1, 멤버_생활정보2));

        // when
        memberLiveInformationRepository.deleteByMemberId(하온.getId());

        // then
        assertThat(memberLiveInformationRepository.count()).isEqualTo(0);
    }
}

~~~

신기하게도 `@DataJpaTest` 와 `@JdbcTest` 는 내부적으로 `@Transactional` 어노테이션을 가지고 트랜잭션 처리를 하고 있었다. 이 어노테이션들은 단순 슬라이스 테스트만이 아닌, 영속성 계층내에 작성된 테스트 코드간의 격리 환경을 만들어주고 있었다. 따라서 영속성 계층 테스트를 격리시키기 위해 `@DataJpaTest` 또는 `@JdbcTest` 활용을 다소 기대해볼 수 있다.

~~~java
@TypeExcludeFilters({DataJpaTypeExcludeFilter.class})
@Transactional // 트랜잭션 활용
@AutoConfigureCache
@AutoConfigureDataJpa
@AutoConfigureTestDatabase
@AutoConfigureTestEntityManager
@ImportAutoConfiguration
public @interface DataJpaTest {
    // ...
~~~

하지만 앞선 `@Transactional` 어노테이션 롤백 전략의 한계점과 같이, 동일한 문제점을 가지고 있다. 영속성 레이어 테스트에 한정해선 간편히 테스트 격리가 가능하지만, 이 외의 계층을 테스트할 땐 이들만으로는 완전한 격리가 불가능하다. 따라서 이 방법 외에 더 완전한 격리를 위한 기법이 필요하다.

### @Sql

다음으로 스프링부트에서 제공하는 `@Sql` 어노테이션으로 격리시킬 수 있다. 테스트 클래스에 이 어노테이션을 명시하여 매 테스트 메소드를 실행하기전에, 지정된 경로의 SQL 스크립트를 실행할 수 있다.

SQL 스크립트내에 `DROP`, `DELETE`, `TRUNCATE` 와 같은 SQL 명령어를 작성하여 깨끗하게 데이터베이스를 비울 수 있다. 참고로 `DROP` 은 테이블 자체를 제거하는 것이고, `DELETE` 는 특정 행을 제거하는 것이며, `TRUNCATE` 는 테이블 자체를 제거하진 않지만, 테이블의 모든 행을 제거하는 것이다. 

우리는 이 SQL 명령어 중 `TRUNCATE` 를 활용하여 각 테스트 실행 뒤 데이터베이스를 깨끗하에 비워줄 수 있을 것이다. 작성 방법은 아래와 같다.

#### clear.sql

임의로 clear 라는 네이밍을 지었지만, 각 상황에 알맞게 truncate.sql 과 같이 명시하여 SQL 파일을 생성하면 될 것이다.

~~~sql
TRUNCATE TABLE member;
TRUNCATE TABLE keyword;
TRUNCATE TABLE live_information;
// ...
~~~

또한 아래와 같이 `@Sql` 어노테이션을 명시하여 테스트를 격리시킬 수 있다.

~~~java
@Sql("/clear.sql")
public class MemberServiceTest {
    // ...
}
~~~

`@Sql` 어노테이션과 `TRUNCATE` 를 작성한 SQL 파일을 활용하면 앞선 방식들보다 확실히, 완전한 테스트 격리가 가능해진다. 더 정확히는, 공유 자원이 데이터베이스인 경우에 사용하면 완벽한 테스트 격리가 가능할 것이다. **특히나 앞선 방식들과 달리 전 구간 E2E 테스트에서도 완벽한 테스트 격리가 가능해진다.**

### @DirtiesContext

사실 이 방법을 사용하면 아주 간단하게, 또한 아주 완벽한 테스트 격리가 가능해진다. 바로 `@DirtiesContext` 어노테이션을 각 테스트에 명시하는 기법이다. 

스프링부트 애플리케이션은 기본적으로 특정 하나의 테스트에서 띄운 `ApplicationContext` 을 재활용한다. 즉, `ApplicationContext` 는 한번 로딩되면 각각의 테스트에서 매번 동일한 컨텍스트를 재사용한다. 하지만 문제점은, 동일한 컨텍스트를 캐싱함으로 인하여 데이터베이스와 같은 공유 자원도 캐싱되어 모든 테스트가 동일한 공유 자원을 사용한다는 점이다. 이 때문에 지금까지 앞선 테스트 격리를 통해 공유 자원을 활용하는 여러 테스트간에 어떻게 격리시킬지에 대해 학습해왔던 것이다.

`@DirtiesContext` 를 사용하면, 각 테스트마다 별도의 새로운 컨텍스트를 띄워서 독립적인 테스트를 할 수 있게된다. 즉, 기존 내용을 캐싱하지 않고 서로 다른 컨텍스트를 띄워서 테스트하기 떄문에 완벽한 격리가 가능해진다.

아래는 우리 하모니 프로젝트에서 테스트 격리 환경을 리팩토링하기전에 `@DirtiesContext` 를 활용한 실제 코드이다.

~~~java
@DirtiesContext
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = TestConfig.class)
@ActiveProfiles("test")
public abstract class AcceptanceTestConfig {
    @LocalServerPort
    private int port;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
    }
}
~~~

**하지만 컨텍스트를 캐싱하지 않고 매번 새롭게 띄우는 작업은 비용이 메우 큰 작업이다.** 따라서 이 어노테이션은 사용 타당성이 충분히 확보된 상황에서 사용하는 것이 좋다. 우리 팀에서 왜 테스트 격리를 위해 초기에 `@DirtiesContext` 를 제거했는지의 자세한 이유는 실전편 포스팅에서 다루고자 한다. 

## 참고

- https://hudi.blog/isolated-test/
- https://tecoble.techcourse.co.kr/post/2020-09-15-test-isolation/
- https://mangkyu.tistory.com/264