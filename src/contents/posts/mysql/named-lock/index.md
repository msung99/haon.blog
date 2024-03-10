---
title: MySQL 네임드 락으로 분산 환경에서의 동시성 이슈를 해결해보자!
date: "2023-07-04"
tags:
  - MySQL
  - 네임드락
  - 동시성
previewImage: mysql.png
series: MySQL InnoDB 아키텍처 개선 과정
---

> 동시성 이슈를 제어하는 방법은 정말 다양하다. 하지만 해당 상황에 적절히 대응하지 못한다면, 성능 저하의 주범이 될 수 있다.

## 비관적 락(Pessimistic Lock) 의 한계

[JPA, MySQL 8.0 에서의 비관적 락 : 공유 락(Shared Lock)과 배타 락(Exclusive Lock) 으로 동시성 이슈 제어하기](https://velog.io/@msung99/JPA-%EC%9D%98-%EB%B9%84%EA%B4%80%EC%A0%81-%EB%9D%BD%EC%97%90-%EB%8C%80%ED%95%9C-LockModeType-%EA%B3%B5%EC%9C%A0-%EB%9D%BD%EA%B3%BC-%EB%B0%B0%ED%83%80-%EB%9D%BD) 에서도 다루었듯이, JPA 의 `비관적 락(Pessmistic Lock)` 을 적절히 활용하면 레코드에 대한 동시성 접근을 제어할 수 있습니다. 이는 분산 환경에서도 문제없이 적용 가능하며 직관적이기 때문에 많이 활용되는 방법입니다.

하지만 `배타락(Exclusive Lock)` 을 획득할 경우, 읽기와 쓰기 연산이 모두 제한됩니다. `상호-배제(Mutual Exclusion)` 측면에서는 쓰레드간의 격리된 연산이 진행된다는 것이 확실히 보장되겠지만, 문제는 **해당 레코드를 활용해야하는 다른 비즈니스 로직 연산들도 모두 대기상태에 빠지기 떄문에 성능저하의 원인이 됩니다.**

### 문제발생 가정

수강신청 사이트가 있다고 해봅시다. Course 라는 테이블이 정의되어 있고, 이 테이블에는 현시간대의 수강신청 인원수 count 필드와 기타 수업정보(수업명, 담당교수명) 등의 정보를 포함하고 있다고 해봅시다. Course 테이블에 대한 레코드가 존재할때, 이 레코드에 대해 여러 클라이언트가 수강신청을 시도하면 동시성 문제가 분명히 발생할 것이므로 비관적 락을 적용할 수가 있을겁니다. 그게 `공유 락(Shared Lock)` 이던 `배타 락(Exclusive Lock)` 으로 구현되던 말이죠.

그러나 비관적 락은 해당 레코드에 락을 걸기 때문에 수강신청이 아닌, 단순히 해당 수업 정보를 조회하고자 하는 유저들은 락이 걸려있어서 계속 대기상태에 빠질 수밖에 없습니다. 결국 락이 필요없는 비즈니스 로직도 대기상태에 빠지게 되며, 의도치 않게 타 로직에 영향을 끼칠 수 있게 됩니다.

---

## 분산 락(Distribution Lock)

[[Redis] 분산락(Distribution Lock) 을 구현해 다중화 서버에서 발생하는 동시성 문제 제어하기](https://velog.io/@msung99/Redis-%EB%B6%84%EC%82%B0-%EB%9D%BD%EC%9D%84-%EA%B5%AC%ED%98%84%ED%95%B4-race-condition-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%9D%B4%EC%8A%88-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0) 에서도 다루었듯이, Redis 차원에서는 Pub/Sub 에 기반한 `Redisson` 를 활용해 분산락을 제공하고 있습니다. 몰론 `스핀 락(Spin Lock)` 방식으로 `Lettuce` 클라이언트를 활용하는 방법도 설명했었지만, 이는 서버의 많은 부하를 안겨주므로 그다지 좋은 방법은 아닙니다.

### Redis 분산락의 한계

이렇듯 Redis 를 활용하여 분산 락을 구현하는 방법은 직관적이고 널리 알려진 방식이기 때문에 사용하기에 무난한 방식입니다. 그러나, 인프라 환경을 구축시 Redis 서버를 따로 구축해야 한다는 특징이 있으며, 이미 Redis 서버가 존재한다고 한들, 락 처리를 위한 목적으로도 사용되어야한다면 추자적인 부하를 안겨줄것이며, `SPOF(단일 장애지점)` 문제가 발생할 가능성도 무시할 수 없습니다.

### 왜 네임드 락(Named Lock) 을 사용하게 되었는가?

분산락을 구현하는 방법에는 MySQL 차원에서 제공하는 네임드 락 기법 외에에도 Redis, Zookeeper 분산 락을 제공합니다. 보편적으로 널리 알려진 방식이 Redis 의 분산락 방식이지만, 이 방식은 Redis 서버에 대해 큰 의존성을 만들기에 부적합한 상황에서는 사용하기에 따라롭습니다.

현재 운영중인 프로젝트에서도 Redis 의 분산락을 활용하는 방식을 고민을 많이했지만, Redis 로 인한 추가적인 인프라 비용이 꽤 부담스러웠기 떄문에 많은 고민을 하다가 네임드 락 기법을 활용하게 되었습니다. 때문에 MySQL 서버 자체를 활용한 네임드 락을 활용한다면, Redis 서버에 대해 큰 의존성을 제거할 수 있게되며, 인프라 비용도 절감해야하는 상황에선 이 방식이 매우 적합합니다.

---

## 분산 락과 DB 락의 차이

이때 햇갈릴 수 있는점은, 분산 락과 일반적으로 DB에서 설명하는 락(`공유락`, `배타락`, `레코드락`)의 개념은 조금 다릅니다. DB 에서 제공하는 락은 레코드나 테이블등의 `공유자원` 자체에 대해 락을 거는 것이지만, 분산락은 `비즈니스 로직, API 등으로 인해 발생하는 임계영역` 에 대해 락을 것입니다.

### 분산락 vs DB 락

![](https://velog.velcdn.com/images/msung99/post/58707231-7fef-4fc5-b208-b336483b3e5c/image.png)

수강신청 상황을 가정해보면, Course 라는 테이블에 기반하여 "수학" 이라는 과목에 대한 엔티티가 생성된 상황을 가정해봅시다. 이 엔티티에는 현 수강신청 인원수 count 필드가 있다면 동시성 문제를 제어하기 위해서 낙관적 락, 비관적 락등의 일반적인 DB 락 기법으로 해결 가능합니다.

여기까지는 문제가 없어보이지만, "Register_Class" 라는 테이블이 있다고 해봅시다. 특정 유저가 "수학" 에 대한 수강신청을 성공한 경우에, 수강신청 상세정보가 "Register_class" 에 기반하여 새로운 엔티티가 생성되어야 합니다. 즉, 수강신청 비즈니스 로직은 "Course" 의 필드중 count 값을 1증가시키며, Register_class 에 대한 엔티티 객체를 하나 생성해야 하는 로직입니다. 이 로직은 일반적인 DB 락 기법만으로는 해결할 수 없으며, 수강신청 로직이라는 `임계영역` 에 대한 동시성 제어로 해결이 가능해집니다.

---

## 동시성 이슈(Concurrency Issue) 상황 가정

[[Redis] 분산락(Distribution Lock) 을 구현해 다중화 서버에서 발생하는 동시성 문제 제어하기](https://velog.io/@msung99/Redis-%EB%B6%84%EC%82%B0-%EB%9D%BD%EC%9D%84-%EA%B5%AC%ED%98%84%ED%95%B4-race-condition-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%9D%B4%EC%8A%88-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0) 이전에 다루었던 수강신청 동시성 문제 상황을 다시 가정해서, 이번에는 MySQL `네임드 락(Named Lock)` 기법을 활용해서 동시성 문제를 해결해봅시다. 지난번과 인프라 환경이 다른점은, Redis 서버를 별도로 띄우지 않았다는 점입니다.

> - 인프라에 API 서버를 2대 띄웠다.

- MySQL DB 서버를 1대를 띄웠다.

### Course

```java
@Entity
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String course_name;
    private Long limit_count; // 수강신청 최대 인원수
    private Long current_count; // 현재 수강신청 인원수 (초기값 0)
}
```

Course 는 이번 학기에 수강신청 가능한 엔티티입니다. 디플트로 "국어" 라는 수강과목을 미리 데이터베이스에 생성해두었으며, 신청가능 최대 인원수는 50 으로 설정해두었습니다.

### RegisterInfo

```java
@Entity
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
public class RegisterInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String course_name;
}
```

수강신청에 성공했을때, 그에대한 로그를 만들기위해 RegisterInfo 라는 엔티티를 정의했습니다. 컬럼으로 어떤 유저가 신청했는지나, 어떤 날짜에 신청했는지등의 상세정보가 들어가야하지만, 이번엔 간단히 수강신청에 성공한 해당 과목명만 저장할 수 있게 해놓았습니다.

### CourseRepository, RegisterInfoRepository

레포지토리는 Spring Data JPA 를 간단히 활용했습니다.

```java
@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
}

@Repository
public interface RegisterInfoRepository extends JpaRepository<RegisterInfo, Long> {
}
```

---

### CourseService

수강신청 비즈니스 로직이 담겨있는 CourseService 입니다. 지난번과 다른점은, RegisterInfo 가 추가된다는 점입니다. 이 로직을 실행한다면 별도의 동시성 문제 처리가 없기 때문에 분명히 문제가 발생할겁니다.

```java
@Service
public class CourseService {
    private final CourseRepository courseRepository;
    private final RegisterInfoRepository registerInfoRepository;

    @Autowired
    public CourseService(CourseRepository courseRepository, RegisterInfoRepository registerInfoRepository){
        this.courseRepository = courseRepository;
        this.registerInfoRepository = registerInfoRepository;
    }

    @Transactional(timeout = 10)
    public void registerCourse(int courseIdx) throws InterruptedException{
        Course course = courseRepository.findById(courseIdx).get();
        course.setCurrent_count(course.getCurrent_count() + 1);

        if(course.getCurrent_count() > course.getLimit_count()){
            throw new RuntimeException("마감 되었습니다.");
        }
        // 아래에 비즈니스 로직 정의
        RegisterInfo registerInfo = new RegisterInfo();
        registerInfo.setCourse_name(course.getCourse_name());
        registerInfoRepository.save(registerInfo);

        courseRepository.save(course);
    }
}
```

---

## 쓰레드 100개 생성 및 동시성 요청

예상했듯이, 문제가 발생했습니다. Jmeter 를 활용해서 쓰레드 100개를 생성하고 수강신청 요청을 보냈을때 current_count 값은 50 이 되고 RegisterInfo 는 50개가 생성되어야 할겁니다.

![](https://velog.velcdn.com/images/msung99/post/d5c7d91d-3427-4b25-892b-b3c6f11c842a/image.png)

그러나 current_count 값은 26개가 되었고, 100개의 쓰레드에 대해 모두 요청이 성공해서 RegisterInfo 가 100개가 생성되었습니다.

![](https://velog.velcdn.com/images/msung99/post/02356e79-c0f5-468e-b169-8a076ce35a34/image.png)

---

## MySQL 네임드 락 (Named Lock)

MySQL 의 `네임드 락(Named Lock)` 은 테이블이나 레코드, 데이터베이스 객체가 아닌 **사용자가 지정한 문자열(String)에 대해 락을 획득하고 반납하는 잠금 기법**입니다. 한 세션이 락을 획득한다면 다른 세션은 해당 세션이 락을 해제할 이후 획득할 수 있습니다. 개발자가 애플리리케이션 단에서 락에대한 문자열 이름을 지정하여 제어가 가능합니다.

앞서 말했듯이 네임드 락은 Redis를 사용하기 위한 인프라 구축, 유지보수 비용을 발생하지 않고, MySQL 을 사용해 분산 락을 구현할 수 있습니다. MySQL 에서는 `GET_LOCK()`을 통해 락을 획득할 수 있고,`RELEASE_LOCK()` 으로 해지할 수 있습니다. 또한 Redis 의 분산락과 마찬가지로 일시적인 락의 정보가 DB에 저장되고, 락을 획득,반납하는 과정에서 DB에 불필요한 부하가 있을 수 있긴합니다. 떄문에 락과 비즈니스 로직의 트랜잭션을 분리할 필요가 있습니다.

가장 중요한 특징은 **한 세션에서 락을 유지하고 있는동안 다른 세션에서는 동일한 문자열 이름에 대한 락을 획득할 수 없게됩니다.** 반대로 말해서, 다른 문자열 이름의 락에 대해선 락을 획득할 수 있는 것이고, 결국 **각 문자열 이름별로 락이 관리되는 형태**입니다.

### Named Lock 쿼리

아래의 모든 함수들은 정상적으로 락을 획득하거나 해제한 경우에는 1을, 아니면 NULL 이나 0을 리턴합니다. 또한 `GET_LOCK` 의 2번째 인자값을 보면 타임아웃도 설정가능한 것을 볼 수 있는데, 지정한 타임아웃만큼 락을 획득하기 위해 대기하게 됩니다.

```java
select GET_LOCK('my_lock', 2);  // my_lock 이라는 문자열에 대해 락을 획득한다.
// 타임아웃은 2초허용 (최대 2초동안 락 획득을 위해 대기)
select RELEASE_LOCK('my_lock'); // my_lock 문자열에 대한 락을 해제
select IS_FREE_LOCK('my_lock'); // 락이 설정되어 있느 상태인지 확인
```

---

## Named Lock 초기적용

### CourseRepository 리팩토링

네임드 락을 활용하기 위해, CourseRepository 에 2가지 메소드를 새롭게 정의해봅시다. getLock 과 releaseLock 에 대한 네임드 락 쿼리 메소드를 정의한 모습을 볼 수 있는데, 메소드의 파라미터로 전달받은 key 값을 기반으로 락을 획득 및 해제합니다.

```java
@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    @Query(value = "select GET_LOCK(:key, :timeoutSeconds)", nativeQuery = true)
    Long getLock(String key, int timeoutSeconds);

    @Query(value = "select RELEASE_LOCK(:key)", nativeQuery = true)
    void releaseLock(String key);
}
```

또한 네임드 락은 Spring Data JPA 나 JPQL 에서 지원하지 않기 떄문에, `nativeQuery` 로 직접 작성해줘야합니다. 또한 nativeQuery 는 기본적으로 내부 트랜잭션을 이용하지 않기때문에, 만약 트랜잭션이 필요하다면 `@Transactional` 어노테이션을 달아야합니다. 하지만 락을 획득하고 해제하는 로직은 영속성을 이용할 이유가 없으며, 이후에 비즈니스 로직과 동일한 트랜잭션을 탈 필요가 없기때문에 여기서는 트랜잭션을 이용하지 않았습니다.

### RegisterCourse 1차 리팩토링

위에서 구현한 네임드 락을 적용했습니다. `getLock` 의 Key 값으로는 "course-lock:" 에다 각 Course 에 대한 pk 값을 기반으로 문자열로 조합했으며, 최대 10초동안 락을 획득하도록 했습니다.

```java
@Transactional(timeout = 20)
public void registerCourse(int courseIdx) throws InterruptedException{
	try {
	// 최대 10초동안 락 획득을 시도
	Long available =  courseRepository.getLock("course-lock:" + courseIdx, 3000);
    if(available == 0){  // 락을 획득하지 못한경우
    	throw new RuntimeException("락을 획득하지 못했습니다.");
    }

    // 비즈니스 로직
    Course course = courseRepository.findById(courseIdx).get();

    if (course.getCurrent_count() ==  course.getLimit_count()) {
		throw new RuntimeException("마감 되었습니다.");
	}
    course.setCurrent_count(course.getCurrent_count() + 1);

	RegisterInfo registerInfo = new RegisterInfo();
    registerInfo.setCourse_name(course.getCourse_name());

	registerInfoRepository.save(registerInfo);

	courseRepository.save(course);
    } finally {
    	courseRepository.releaseLock("course-lock:" + courseIdx); // 락을 해제
    }
}
```

### 네임드 락을 적용했지만 문제는 여전하다

그런데 다시 100개의 쓰레드를 생성하고 테스트를 돌려보면, RegisterInfo 가 최대 50개만 생성되어야함에도 불구하고 간혹 그 이상으로 많은 데이터가 생성된 결과를 조회할 수 있게되었습니다. **실패한 이유는 분산락의 해제 시점과 @Transactional 을 이용한 트랜잭션 커밋 시점의 불일치 때문입니다.**

---

## Facade 패턴 로직으로 구현

### 왜 네임드 락을 적용해도 문제가 발생하는걸까? : REPEATABLE READ

![](https://velog.velcdn.com/images/msung99/post/83fa6c89-d914-43ee-81c9-45bfb10c88ff/image.png)

`@Transactional` 은 별도의 설정값이 없다면 기본적으로 MySQL 의 기본 격리수준인 `REPEATABLE READ` 으로 동작하게됩니다. 또 앞선 코드를 봤다면 알겠지만, 락 획득과 해제는 registerCourse 메소드 내부에서 동작하고 있습니다. 이 때문에 트랜잭션 A 가 락을 해제하고 커밋되기 전에, 이 락을 기다리던 트랜잭션 B 가 락을 바로 획득한 후 current_count 값을 조회를 상황이 발생하기 때문에, 트랜잭션 A 가 커밋되기 이전의 값을 B가 조회하게 되면서 문제가 발생하는 것입니다.

### 해결방법1 : 트랜잭션을 제거

해결방법은 정말 간단합니다. `@Transactional` 을 제거함으로써 트랜잭션이라는 논리적인 연산 단위 자체가 없어지도록 만드는것입니다. 이렇게 되면 클라이언트 A 입장에서 네임드 락을 헤재했을때 이미 current_count 값은 DB 상에 정상 반영된 상태이므로, 클라이언트 B 가 해제된 락을 즉시 획득하고 current_count 값을 조회하면 정상 반영된 값을 조회할 수 있게 됩니다.

하지만 이 방식은 데이터 일관성의 문제를 쉽게 해칠 수 있으며, 문제가 발생하더라도 롤백이 되지 못하는 구조이기 떄문에 좋지 못한 방식입니다.

### 해결방법2 : 논리적인 단위로 트랜잭션을 분이하기

수강신청 비즈니스 로직과 락 생성 및 해제 로직을 별도의 트랜잭션으로 따로 분리하는 방법입니다. 락을 획득하고 해제하는 로직이 기존 비즈니스의 로직의 트랙잭션 범위 밖으로 벗어나서, 별도의 새로운 트랜잭션으로 처리되는 방식인것입니다. 아래에서 이어서 자세히 설명하겠습니다.

### Facade 패턴으로 네임드 락에 대한 로직을 별도로 분리하기

이를 해결하기위해 `Facade 패턴` 을 적용해서 수강신청 메소드를 기능별로 캡슐화시키서 로직을 분리해봅시다. 네임드 락에 대한 로직과, 비즈니스 로직을 별도의 메소드로 각각 분리하고, 별도의 트랜잭션으로 처리할 것입니다. 이를위해 트랜잭션 전파 속성인 `REQUIRES_NEW` 로 분리할 것입니다.

```java
@Transactional(timeout = 20)
public void registerCourse2(Integer courseIdx) {
	String lock_key = courseIdx.toString();
    try {
    	// 락 획득을 시도
		Long available = courseRepository.getLock(lock_key, 3000);
         if(available == 0){  // 락을 획득하지 못한경우
		 	throw new RuntimeException("락을 획득하지 못했습니다.");
     }

     // current_count 에 대한 커밋이 보장된 상태에서 락을 해제
	 registerCourseLogic(courseIdx);

	} finally {
      courseRepository.releaseLock(lock_key); // 락을 해제
    }
}


@Transactional(propagation = Propagation.REQUIRES_NEW)
public void registerCourseLogic(int courseIdx){
	// 비즈니스 로직
	Course course = courseRepository.findById(courseIdx).get();

	if (course.getCurrent_count() ==  course.getLimit_count()) {
		throw new RuntimeException("마감 되었습니다.");
	}
    course.setCurrent_count(course.getCurrent_count() + 1);

	RegisterInfo registerInfo = new RegisterInfo();
    registerInfo.setCourse_name(course.getCourse_name());

    registerInfoRepository.save(registerInfo);
    courseRepository.save(course);
}

```

보듯이 비즈니스 로직을 따로 분리해서 `REQUIRES_NEW` 로 별도의 트랜잭션으로써 처리되도록 했습니다. 이로써 current_count 컬럼 값이 완벽히 DB 상에 반영되고나서 (커밋되고나서), 안전하게 락을 해제한 후에 대기하고 있었던 다음 쓰레드가 락을 획득하고 current_count 값을 읽어오게 됩니다.

실제로 쓰레드 100개를 생성하고 다시 생성을 했을떄도 정상적으로 50개의 요청이 성공하고, 나머지 50개의 요청이 거절되는 모습을 확인할 수 있습니다.

---

## 네임드 락을 언제 사용해야할까?

앞서 소소하게 언급했던 주제이지만, 마무리겸 다시 한번 정리해보고자 합니다.

### 분산락 vs 일반적인 DB 락

우선 일반적인 락과 분산락은 다른 개념이라고 말했듯이, **어떤 타깃이 동시성 문제의 제어가 될것인지에 따라서 분산락 사용유무가 달라질 것입니다.** `비즈니스 로직`이 제어의 타깃이라면 분산락이 적합할 것이고, 반대로 엔티티에 대한 제어가 타깃이라면 DB 락으로 해결 가능할것입니다.

### 확장성

확실한건 네임드락을 활용했을때 Redis, Zookeeper 와 같은 별도의 서버 사용이 요구되지 않기 때문에, `비용 절약`에 있어서는 매우 좋습니다. 하지만 락에 대한 정보가 매번 MySQL 에 저장되어야 하기 떄문에 `부하` 가 생길 수 밖에 없고, 실제 DB 에 락으로 인한 커넥션 대기가 발생하기 때문에 성능상 단점이 있습니다.

또한 DB 확장성 측면에서 좋지 못합니다. 데이터베이스에 대해 `레플리케이션(Replication)`, `파티셔닝(Partitioning)` 등을 진행해서 여러 데이터베이스로 확장될 경우 각 DB 별로 따로 락 정보를 보관하고 있기 때문에, 일관성의 문제가 발생할 것입니다. 이런 면에서는 확실히 Redis 메시지브로커를 활용한 분산락이 더욱이 매력적입니다.

정리하자면, 추가적인 리소스 비용없이 비용 절약을 위해선 네임드 락을 활용한 방식이 좋겠지만, 확장성 측면에선 제한사항이 생기게되므로 상황에 따라 적절히 분산 락 구현 전략을 선택하는게 좋을겁니다.

---

## 더 학습해볼 키워드

- 네임드 락 이외의 데이터베이스 락 기법들
- Facade 전략

---

## 참고

- Real MySQL 8.0 (백은빈, 이성욱 지음)
- https://dev.mysql.com/doc/refman/8.0/en/locking-functions.html
- https://sudal.site/namedLock/
- https://github.com/hyojhand/spring-java-lab/tree/main/spring-concurrency
- [동시성 문제 해결하기2 - 네임드 락(Named Lock) & Redis를 활용한 분산 락(Distributed lock)](https://velog.io/@hyojhand/named-lock-distributed-lock-with-redis)
- [분산락으로 동시성 문제 해결하기(Redis, 네임드 락)](https://sungsan.oopy.io/5f46d024-dfea-4d10-992b-40cef9275999)
