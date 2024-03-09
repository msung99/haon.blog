---
title: @Component - 컴포넌트 스캔의 필요성에 대해
description: 컴포넌트 스캔은 왜 필요한가?
date: "2024-01-23"
tags:
  - 객체지향
  - OOP
  - ComponentScan
---

## 시작에 앞서

> 본 포스팅은 저 혼자서 [인강](https://www.inflearn.com/roadmaps/373) 을 듣고 나만의 예재로 새롭게 만들어 본 내용입니다. 틀린 내용이 많을 수 있으니, 감안해주세요!

본 포스팅은 제 지난 포스팅 시리즈 [직접 만들어보며 이해하는 SOLID 원칙과 DI 설계 : 수동으로 직접 의존관계 주입해보기](https://velog.io/@msung99/%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%ED%95%98%EB%A9%B0-%EC%9D%B4%ED%95%B4%ED%95%98%EB%8A%94-SOLID-%EC%9B%90%EC%B9%99%EA%B3%BC-DI-%EC%84%A4%EA%B3%84-Bean%EC%9D%84-%ED%86%B5%ED%95%B4-%EC%88%98%EB%8F%99%EC%9C%BC%EB%A1%9C-%EC%9D%98%EC%A1%B4%EA%B4%80%EA%B3%84-%EC%A3%BC%EC%9E%85%ED%95%B4%EB%B3%B4%EA%B8%B0) 에 이어서 진행되는 내용입니다. 이전 포스팅을 읽고 오시는 것을 권장드립니다!

#### 객체지향 시리즈 포스팅 진행현황

현재 진행중인 포스팅 내용은 아래와 같습니다. 그 중 5번째 포스팅을 지금 진행해볼까합니다!

> - 객체지향을 아는척하지 말자 : 오해하고 있었던 객체지향의 정체

- 예제로 이해하는 SOLID 5원칙, 그리고 스프링 DI 컨테이너의 등장
- 직접 만들어보며 이해하는 SOLID 원칙과 DI 설계 : 수동으로 직접 의존관계 주입해보기
- 싱글톤(SingleTon) : 왜 스프링 컨테이너를 써야할까?
- **컴포넌트 스캔과 @Autowired 의 메커니즘 : 필요성에 대해 (현재 포스팅)**
- 알면 도움될 컴포넌트 스캔의 다양한 대상들과 DI 에 대한 해결방법

---

## 의존관계를 수동으로 직접 주입해야할까?

지난번 포스팅 시리즈에서 다룬 내용들은 모두 스프링 컨테이너에 빈을 직접 등록하고, 의존관계를 생성하는 것이었습니다.

그런데, 이렇게 등록해야 할 스프링 Bean 이 수백개가 되면 일일이 등록하기도 귀찮아지고, 매핑관계가 햇갈려지지 않을까요? 이를 해결하도록 **스프링에서는 설정정보가 없어도 자동으로 스프링 빈을 등록하는 컴포넌트 스캔이라는 기능을 지원해줍니다.**

또한 의존관계도 자동으로 주입해주는 Autowired 도 지원해줍니다.

---

## 컴포넌트 스캔

- 컴포넌트 스켄은 이름 그대로 @Component 어노테이션이 붙은 클래스를 스캔해서 스프링 빈으로 등록합니다.

참고로 @Configuration 이 컴포넌트 스캔의 대상이 된 이유도 @Configuration 소스코드 원본을 열어보면 @Component 어노테이션이 붙어있기 때문입니다.

### 컴포넌트 스캔 대상 : @Component 어노테이션

![](https://velog.velcdn.com/images/msung99/post/9dabb486-489f-4a74-b7ee-1cb89a90d726/image.png)

- 컴포넌트 스캔은 @ComponentScan 어노테이션이 붙은 구현 클래스들을 기반으로 의존관계를 주입해줍니다.

지난 포스팅에서 진행했었던 도메인 설계내용을 다시 가져와봤는데, 기억나시나요?

CarRepository 인터페이스에 대한 구현 클래스를 SonarTarRepository 를 선택하고 싶다고 해봅시다. 그러면 SonarTarRepository 만 @ComponentScan 어노테이션을 붙여줘서 컴포넌트 스캔 대상에 포함되도록 해주면 됩니다.

아래와 같이 어노테이션을 추가해주시면 됩니다.

```java
@Component  // 맨 위에 어노테이션만 붙여주면 컴포넌트 스캔 대상에 포함된다!
public class SonarTarRepository implements CarRepository {

    private static Map<Integer, Car> carList = new HashMap<>();
    int autoCarIdx = 1;

    @Override
    public void makeCar(Car sonarTar) {
        carList.put(autoCarIdx, sonarTar);
        autoCarIdx++;
    }

    @Override
    public Car getCarInfo(int carIdx) {
        Car car = carList.get(carIdx);
        return car;
    }

    @Override
    public void incrementSpeed(int carIdx) {
        Car car = carList.get(carIdx);
        car.curSpeed += 20;
    }
}

```

### Bean 등록 설정정보 클래스 : @ComponentScan, @Configuration

그런데 @Component 어노테이션만 명시해준다고 해서 바로 스프링 빈으로 등록되는 것이 아닙니다. 지난번에 진행했던 외부 설정정보 클래스 BeanConfig 처럼, 설정정보를 담고있는 클래스를 생성해줘야 합니다.

- 컴포넌트 설정정보 클래스에는 @ComponentScan 어노테이션과, 지난번처럼 @Configuration 를 명시해줘야합니다.

```java
@Configuration
@ComponentScan
public class AutoBeanConfig {

}
```

위와 같이 명시해주면 끝입니다. 이전에는 @Bean 어노테이션을 일일이 등록해줘야 했는데, 정말 간단해졌죠? 설정정보 클래스 AutoBeanConfig 안에는 별내용이 들어있지도 않아서, 의존관계를 주입할때 햇갈릴일이 전혀 없어졌습니다.

### 유의사항

추가적으로 컴포넌트 스캔에서 제외하고 싶은 클래스 및 파일들은 아래와 같이 해주시면 됩니다.

```java
@Configuration
@ComponentScan(
        basePackages = "hello.core", // 디폴트는 AutoAppConfig 가 있는 패키지 (hello.core) 에 있는 것들을 모두 컴포넌트 스캔한다. => 권장방법 : 패키지 위치를 이렇게 지정하지 말고, 설정 정보 클래스의 위치를 프로젝트 최상단에 두는 것이다.
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Configuration.class)  // 컴포넌트 스캔을 해서 자동으로 모든것을 스프링 빈으로 등록할 때, 그 중에서 뺄것을 지정해주는 것
)        // 기존 클래스 BeanConfig 와 다르게 @Bean 으로 등록한 클래스가 하나도 없다!
public class AutoAppConfig {

}
```

지난번에 만들었던 설정정보 클래스 BeanConfig 같은 클래스 및 파일들이 없어지지 않고 존재한다면, 위와같이 컴포넌트 스캔 대상에서 제외시켜줘야 합니다.
**BeanConfig 클래스와 같이 @Configuration 어노테이션이 붙은 클래스들도컴포넌트 스캔의 대상에 포함된다는 것을 유의합시다!**

---

## 컴포넌트 스캔시 자동 의존관계 주입 : @Autowired

그런데 문제점이 하나 있습니다. 컴포넌트 스캔을 통해 스프링 빈을 등록하면, **의존관계는 어떻게 주입시켜줄까요?** 의존관계를 주입시켜줄 방법이 없는데 말입니다. 이때 바로 @Autowired 어노테이션을 써야합니다.

이전에 BeanConfig 에서는 @Bean 으로 직접 설정 정보를 작성했고, 의존관계도 직접 명시했습니다.

이제는 이런 설정 정보 자체가 없기 떄문에, 의존관계 주입도 이 클래스 안에서 해결해야 한다. 이때 @Autowired 는 의존관계를 자동으로 주입해줘야하비다.

> 컴포넌트 스캔시 기존 @Bean 어노테이션을 사용하는 설정정보 클래스와 달리 의존관계를 주입할 방법이 없다. 이때 @Autowired 를 통해 의존관계를 자동으로 주입시켜주자!

---

## 자동 의존관계를 주입하는 방법과 과정

결론부터 말씀드리자면 아래와 같습니다.

> 생성자에 @Autowired 를 지정하면, 스프링 컨테이너가 자동으로 해당 스프링 빈을 찾아서 주입한다.

이어서 컴포넌트 스캔과 의존관계 주입의 전반적인 과정을 요약해보자면 다음과 같습니다.

- 1.컴포넌트 스캔을 위해, 스캔 대상에 포함시킬 구현 클래스들에 @Component 어노테이션을 붙여준다.

- 2.컴포넌트 스캔을 위한 설정정보 클래스를 생성해준다.

- 3.컴포넌트 스캔을 위해 @Component 을 붙여준 각 구현 클래스의 생성자에 @Autowired 를 붙여줘서 자동으로 의존관계가 주입되도록 해준다.

---

## 자동 의존관계가 주입되는 메커니즘

게속해서 어떤 원리로 컴포넌트 스캔을 통한 Bean 등록 및 의존관계가 자동으로 주입되는 것인지 알아보겠습니다.

### 1. 컴포넌트 스캔 대상을 선택해서 스프링 빈으로 등록하기

예를들어 계속 이번 포스팅 시리즈에서 살펴봤던 SonarTarRepository, StarRexRepository 중에서 컴포넌트 스캔 대상으로 SonarTarRepository 를 선택해서 스프링 빈으로 등록했다고 해봅시다.

```java
@Component
public class SonarTarRepository implements CarRepository {
     // ... (세부 구현내용 생략)
}
```

그렇다면 아래처럼 스프링 컨테이너에 SonarTarRepository 에 대한 Bean 이 등록될겁니다.

![](https://velog.velcdn.com/images/msung99/post/ff5a73c4-8fd9-4099-9b2f-7cbf472bcfc6/image.png)

### 2. 컴포넌트 스캔을 위한 설정정보 클래스 생성해주기

계속 앞서 언급드렸던 내용이죠? 자세한 설명은 생략하겠습니다.

```java
@Configuration
@ComponentScan
public class AutoBeanConfig {

}
```

### 3. @Autowired 를 생성자에 명시하여 의존관계 주입해주기

다음으로는 생성자에 @Autowired 를 명시하여 자동으로 의존관계를 주입하게 해주면 됩니다. 이때 어떻게 자동 의존관계가 주입되는가 묻는다면, **앞서 스프링 빈에 등록된 스프링 빈들을 뒤져봐서 적합한 빈을 선택하고, 의존관계를 주입해주는 방식** 인겁니다.

#### 기존 코드

기존코드가 아래와 같다고 해봅시다. 아래와 같은 코드로는 @Autowired 없어서 의존관계가 주입되지 않습니다.

```java
@Component
public class CarServiceImpl implements CarService{

    private final CarRepository carRepository;

    public CarServiceImpl(CarRepository carRepository){
        this.carRepository = carRepository;
    }

    @Override
    public void makeCar(Car car) {
        carRepository.makeCar(car);
    }

    // ... (이하 세부구현 내용 생략)
}
```

그런데 아래와 같이 @Autowired 를 명시해주면, 앞서 스프링 컨테이너에 등록된 Bean 중에서 적합한 Bean 을 찾고 의존관계를 알아서 주입해주는 것입니다. 이번 예제에서는 SonarTarRepository 에 대한 Bean 이 선택되고 의존관계가 주입되겠죠?

#### 리팩토링 코드

```java
@Component
public class CarServiceImpl implements CarService{

    private final CarRepository carRepository;

    @Autowired
    public CarServiceImpl(CarRepository carRepository){
        this.carRepository = carRepository;
    }

    @Override
    public void makeCar(Car car) {
        carRepository.makeCar(car);
    }

    // ... (이하 세부구현 내용 생략)
}
```

---

## 자동 의존관계 주입 메커니즘 세부분석

앞선 과정을 좀 더 세부적으로 설명드리자면 다음과 같습니다.

- CarServiceImpl 에 대한 스프링 빈을 생성하면서, 스프링은 스프링 컨테이너에 있는 CarRepository 에 대한 스프링 빈이 있는지 뒤집니다.

- 정확히는 뒤져볼때 **타입을 기준으로 뒤져봅니다.** 즉 CarRepository 와 같은 타입이 스프링 빈으로 등록되어 있는지 보는 것입니다.

- 따라서 스프링 빈 중에서 SonarTarRepository 를 타입이 동일한것으로 찾게되고 의존관계를 주입해줍니다.
  (=> 어짜피 상속 관계에서 SonarTarRepository 는 CarRepository 의 자식 타입이니, 같은 타입으로 인식하는 것입니다! )

---

## 마치며

이로써 기존에 스프링 설정정보를 수동으로 일일이 입력하던 귀찮은 작업없이, 컴포넌트 스캔과 @Autowired 를 통해 자동으로 의존관계를 주입하는 방법에 대해 메커니즘을 자세히 알아봤습니다.

이번 포스팅을 마무리로 스프링의 객체지향 관련 시리즈 블로깅을 마무리 지으려고 했으나, Autowired, 컴포넌트 스캔과 관련해 추가적으로 알면 크게 도움될 내용들에 관해 하나 더 진행해볼까합니다.

궁금한점이 있으시다면 댓글로 알려주세요! 도와드리겠습니다 😉
