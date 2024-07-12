---
title: SpringBoot AOP 와 프록시 객체는 무엇이고, 왜 필요할까?
date: "2023-07-11"
tags:
  - AOP
  - 스프링
previewImage: spring.png
---

## 학습배경

AOP 과 프록시 객체를 확실히 학습해야겠다는 생각을 하게되어서, 이번에 AOP 에 대해 다루어보고자 합니다.

---

## AOP (Aspect Oriented Programming)

![](https://velog.velcdn.com/images/msung99/post/49400a29-b92c-459f-a0b7-e5216f742267/image.png)

AOP 는 Aspect Oriented Programming 의 약자로, `관점 지향 프로그래밍` 이라고 불립니다. 어떤 로직을 기준으로 **핵심적인 관점, 부가적인 관점**으로 나누어서 보고 그 관점을 기준으로 `모듈화` 하겠다는 것입니다. 쉽게말해, 모든 클래스 및 메소드에서 자주 등장할 중복되는 관심사와 코드를 별도로 분리하고 모듈화를 진행함으로써 중복되는 코드를 줄이고 가독성을 높이는 방법이라고 보면됩니다.

### 흩어진 관심사 (Cross-Cutting Concerns)

> AOP 는 Aspect 를 모듈화하고 핵심 비즈니스 로직에서 분리하여 재사용하는 것이다.

가령 위와같이 3개의 서비스가 있고, 각 서비스에 담긴 여러 메소드들은 모두 `로깅(Logging)` 과 `메소드 수행시간 측정` 이라는 기능을 공통적으로 포함하고 있다고 해보죠. 이들의 의미는 각 클래스 및 메소드에서 중복되는, 필드, 로직 및 코드들이 나타난다는 것입니다. 이렇게 반복되는 코드를 `흩어진 관심사` 라고 부르는 것입니다.

AOP 는 이렇게 흩어진 관심사를 `Aspect` 를 이용해서 해결합니다. `Aspect` 란 흩어진 관심사라는 공통 부분을 모듈화 시킨 것으로, 개발자는 모듈화 시킨 `Aspect` 를 어느곳에 사용하는지만 정의해주면 됩니다.

---

## 프록시 패턴(Proxy Pattern)

아래와 같이 주문 관련 Order 서비스가 있다고해봅시다. 앞서봤던 "실행시간 측정" 이라는 중복 코드를 여러 메소드에 보유하는 상황을 가정할 것입니다.

### OrderService

우선 주문 관련 인터페이스를 정의했습니다. 클라이언트는 주문 서비스를 이 인터페이스로 소통하게 됩니다.

```java
public interface OrderService {
    void createOrder();
    void getOrderInfo();
    void deleteOrder();
}
```

### SimpleOrderService

OrdeService 를 구현한 SimpleOrderService 입니다. 각 메소드의 수행시간을 측정하도록 기능을 추가했는데, **핵심 비즈니스 로직이 잘 보이지 않아서 가독성이 떨어지고**, **모든 메소드에 적용할 경우 대량의 중복 코드가 발생**한다는 단점이 있습니다. 이를 해결하기 위해, AOP 는 기존 코드를 수정하지 않고 공통(중복) 코드를 모두 적용가능하게 하는 `프록시 패턴` 을 제공하고 있습니다.

```java

@Service
public class SimpleOrderService implements OrderService{
    @Override
    public void createOrder(){
        long begin = System.currentTimeMillis();
        try{
            Thread.sleep(1000);
        } catch (InterruptedException e){
            e.printStackTrace();
        }
        System.out.println("Completed createing an Order.");
        System.out.println(System.currentTimeMillis() - begin);
    }

    @Override
    public void getOrderInfo(){
        long begin = System.currentTimeMillis();
        try{
            Thread.sleep(2000);
        } catch (InterruptedException e){
            e.printStackTrace();
        }
        System.out.println("Completed getting an Order.");
        System.out.println(System.currentTimeMillis() - begin);
    }

    @Override
    public void deleteOrder(){
        long begin = System.currentTimeMillis();
        try{
            Thread.sleep(2000);
        } catch (InterruptedException e){
            e.printStackTrace();
        }
        System.out.println("Completed deleting an Order.");
        System.out.println(System.currentTimeMillis() - begin);
    }
}
```

### 프록시 패턴 적용 클래스

클라이언트는 인터페이스 타입으로 프록시 객체를 사용하게 되고, 프록시는 Real Object 인 SimpleOrderService 를 감싸서 수행시간 측정이라는 부가기능을 처리하게 됩니다. **즉, 인터페이스 타입 기반의 클라이언트 요청은 프록시 객체로 먼저 들어오게 되고, 프록시 객체는 중복되는 코드에 대한** `부가 기능` **을 수행합니다. 그러고 기존 핵심 비즈니스 로직만을 보유한 클래스가 호출되어 수행되는 방식입니다.** 이로써 기존 핵심 비즈니스 로직을 별도로 분리하고, 부가 기능은 별도로 분리하며 관심사가 분리된 방식이 되었습니다.

```java
@Primary
@Service
public class ProxySimpleEventService implements OrderService{

    private SimpleOrderService simpleOrderService;

    @Autowired
    public ProxySimpleEventService(OrderService orderService){
        this.simpleOrderService = simpleOrderService;
    }

    @Override
    public void createOrder(){
        long begin = System.currentTimeMillis();
        simpleOrderService.createOrder(); // 비즈니스 로직
        System.out.println(System.currentTimeMillis() - begin);
    }

    @Override
    public void getOrderInfo(){
        long begin = System.currentTimeMillis();
        simpleOrderService.getOrderInfo(); // 비즈니스 로작
        System.out.println(System.currentTimeMillis() - begin);
    }

    @Override
    public void deleteOrder(){
        long begin = System.currentTimeMillis();
        simpleOrderService.getOrderInfo(); // 비즈니스 로직
        System.out.println(System.currentTimeMillis() - begin);
    }
}
```

하지만 이 방식도 아직은 중복되는 코드를 계속 처리해줘야한다는 점에선 해결되지 못했습니다. 이를위해 등장한것이 바로 Spring AOP 입니다.

---

## Spring AOP

AOP 의 핵심기능은 핵심 비즈니스 로직을 수정하지 않으면서, 공통 부가기능 및 관심사의 구현을 추가하는 것이라고 했었습니다. 핵심 기능에다 공통 부가기능을 추가하는 방법은 아래 3가지 시점에 추가가능합니다.

### AOP 방식

- 컴파일 시점 : 컴파일 시점에 코드에 공통 기능을 삽입. 자바 파일( .java) 을 클래스 파일 (.class) 로 만들때 바이트 코드를 조작하여 적용된 바이트 코드를 생성하는 방식

- 클래스 로딩 시점 : 클래스 로딩 시점에 공통 기능을 삽입. 컴파일은 원래 클래스 그대로 하고, 클래스를 로딩하는 시점에 끼워서 넣는다.

- 런타임 시점 : 런타임 시점에 프록시 객체를 사용하여 공통 기능을 삽입. A 라는 클래스를 빈으로 만들때 A 라는 타입의 프록시 빈을 감싸서 만든후에, 프록시 빈이 클래스 중간에 코드를 추가해서 넣는다.

스프링은 위 방법중에 3번쨰 방법인 `런타임 시점` 에 공통 기능을 삽입하는 AOP 방법을 채택하고 있습니다. 따라서 **스프링 AOP 는 메소드 실행시점에만 AOP 를 적용할 수 있고, 스프링 컨테이너가 관리하는 빈에만 적용할 수 있습니다.**

참고로 알아두면 좋은것은, 컴파일과 클래스 로딩 시점 방식은 AOP 프레임워크는 AspectJ 가 제공하는 컴파일러나 클래스 로더 조작기 같은 새로운 것을 사용해야 합니다. 따라서 더 유연한 AOP 적용이 가능하겠지만, 부가적인 의존성을 추가해야 한다는 단점이 있습니다.

### 스프링 AOP 적용하기

먼저 Spring에서 AOP를 사용하기 위해서는 spring-starter-aop 의존성을 추가해주어야 합니다.

```java
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

### 시간측정 모듈 분리 리팩토링

```java
@Component
@Aspect
public class PerfAspect {
    @Around("execution(* com.example.aop.test.create*(..))")
    public Object logPerf(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        long begin = System.currentTimeMillis();
        Object reVal = proceedingJoinPoint.proceed(); // 핵심 비즈니스 로직을 담고있는 타깃
        System.out.println(System.currentTimeMillis() - begin);
        return reVal;
    }
}

```

Spring AOP 는 **무조건 Bean 으로 등록된 대상에 대해서만 프록시 빈으로 감쌉니다.** 즉, 클래스 A가 스프링 빈으로 등록될때 새로운 프록시 빈이 감싸지고, 그 생성된 프록시 빈이 클래스 A 의 중간에 코드를 추가해서 넣는 방식입니다. 이를위해 `@Component` 어노테이션으로 클래스를 빈으로 등록해줍시다.

또 `@Aspect` 어노테이션으로 시간측정 공통 코드를 Aspect 모듈로 분리시켜서 정의해었습니다. 메소드에 `@Around` 어노테이션이 있는걸 볼 수 있는데, 이는 스프링에서 구현가능한 Advice 모듈중에 한 종류입니다. **메소드의 실행 전후 또는 Exception 발생 시점에 부가 기능을 추가한다는 것입니다.** 또한 `execution()` 안에 com.example.aop.test 패키지 밑에있 클래스들 중에서 이름이 create 로 시작하는 메소드에 대해서만 적용함을 명시하는 것입니다.

`ProceedingJoinPoint` 의 `proceed()` 메소드도 호출한 것을 볼 수 있습니다. 이는 핵심 비즈니스를 들고있는 대상입니다. 즉, 위와같이 정의한 시간측정 모듈을 호출할 대상을 호출하는 것입니다.

추가적으로 `@Around` 외에도 `@Before`, `@AfterRunning` 등으로 어떤 타이밍 및 조건에 부합할때 메소드에 모듈을 적용할지 정할 수 있으니, 찾아보길 바랍니다.

### AOP 주요 개념

- Aspect : 위의 사진에서 처럼 Aspect 안에 모듈화 시킨 것을 의미한다.
- Advice : 실질적으로 어떤 일을 해야하는지를 담고 있다.
- Pointcut : 어디에 적용해야 하는지에 대한 정보를 담고 있다.
- Target : Aspect에 적용이 되는 대상
- Join point : Advice가 적용될 위치, 끼어들 수 있는 지점. 메서드 진입 지점, 생성자 호출 시점, 필드에서 값을 꺼내올 때 등 다양한 시점에 적용가능(여러가지 합류 지점임)

---

## 참고

- https://docs.spring.io/spring-framework/docs/2.5.5/reference/aop.html
- https://devlog-wjdrbs96.tistory.com/398
- https://code-lab1.tistory.com/193
- https://atoz-develop.tistory.com/entry/Spring-스프링-AOP-개념-이해-및-적용-방법
