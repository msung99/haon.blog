---
title: 자바의 EnumMap은 무엇이고, 왜 HashMap 보다 성능이 더 빠른가?
date: "2024-09-11"
tags:
  - JAVA
  - enum
  - EnumMap
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## EnumMap

![](https://velog.velcdn.com/images/msung99/post/f8e84400-5a01-451d-857d-d2c4586b0645/image.png)

EnumMap 이란 키(key) 를 특정 Enum 타입만을 사용하도록 하는 Map 인터페이스의 구현체입니다. Map 에 대한 구현체이므로, 당연히 Map 에서 제공하는 메소드들을 모두 사용 가능합니다.

### 그래서 EnumMap 이 왜 빠른건데?

EnumMap 에 대해서 찾아보길, `HashMap` 과 같은 Map 구현체들에 비해서 빠른 성능을 낼 수 있다고 알려져있습니다. 왜 EnumMap 이 다른 구현체들보다 더 빠른 성능을 낼 수 있을까요?

### EnumMap VS HashMap

![](https://velog.velcdn.com/images/msung99/post/620e5906-779c-449b-9923-611d26e0224c/image.png)

우선 `HashMap` 의 동작방식에 대해 이해할 필요가 있습니다. Hash 는 어떤 방식보다도 검색에 빠르지만, 이를 위해서는 **별도의 해싱 작업이 필요합니다.** 즉, HashMap 은 해시 값을 만들고, `해시 충돌(Hash Collision)` 에 대응하기 위한 작업 처리가 필요합니다.

> Enum 에 대한 자세한 설명은 [[JAVA] 열거(Enum) 타입? 그거 어떻게 사용하는건데? 🤷‍♂️](https://velog.io/@msung99/JAVA-%EC%97%B4%EA%B1%B0Enum-%ED%83%80%EC%9E%85-%EA%B7%B8%EA%B1%B0-%EC%96%B4%EB%96%BB%EA%B2%8C-%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%EA%B1%B4%EB%8D%B0) 을 참고하자.

![](https://velog.velcdn.com/images/msung99/post/289328a8-0bdd-43b7-b32a-5797dcef94c6/image.png)

반면 `EnumMap` 은 어떨까요? 우선 `Enum` 의 특징을 다시 되짚어보면 상수의 선언 순서대로 일정한 순번을 가집니다. 때문에 Enum 객체의 `ordinal()` 을 활용해서 열거타입 객체의 순번을 가져올 수 있는것이라고 했었습니다.

이렇게 "순번" 정보를 가지고있다는 특징으로 인해, EnumMap 은 내부적으로 배열에다 값을 저장할 수 있고, 실제로 내부적으로 배열에 열겨헝 데이터들을 저장하는 구조합니다. 결국 배열의 인덱싱 및 연산을 떠올려보면, HashMap 과 달리 해싱 및 해싱 충돌작업에 대한 별도의 작업을 수행하지 않습니다.

또한 HashMap 의 경우 데이터의 개수가 많아지고 일정 크기에 도달하면 구조 재조정 작업이 필요하지만, EnumMap 의 경우 전달된 Enum 타입의 상수 개수만큼만 저장공간을 확보하면 되므로 이 작업이 필요하지 않습니다.

### EnumMap 의 특징

EnumMpa 의 특징을 정리해보자면, 다음과 같습니다.

- EnumMap 은 내부저긍로 데이터를 저장할 때 배열을 사용한다.
- 기본 연산들이 상수시간 안에 수행된다.
- 캐싱을 통한 성능 향상을 위해 key 배열 또한 내부적으로 가지고있다.
- equals 연산을 수행시, 내부의 key 와 value 가 모두 일치하는지 전체 순회를 통해 확인한다.

---

## EnumMap 연산

### EnumMap 선언방법

생성자에 Enum 클래스 타입을 직접 인자로 전달해야 한다는 것을 유의합시다.

```java
EnumMap<Direction, Ineger> myMap = new EnumMap(Direction.class);
```

### get

이 외에는 기본적으로 Map 의 구현체이므로, Map 에서 제공하는 모든 기능을 사용할 수 있습니다. 예를들어 `get()` 을 활용하여 key 에 대한 value 값을 조회할때는, 열거타입 객체를 인자로 넘겨주면 됩니다.

```java
Map<Direction, Integer> directionIntegerMap = new EnumMap<Direction, Integer>(Direction.class);
Integer eastValue = directionIntegerMap.get(Direction.EAST);
```

### remove

특정 날짜의 매핑을 해제하려면 간단히 remove() 를 호출하면 됩니다.

```java
directionIntegerMap.remove(Direction.EAST);
```

---

## 참고

- https://www.geeksforgeeks.org/enummap-class-java-example/
- https://hudi.blog/java-enum-map/
- https://www.manty.co.kr/bbs/detail/develop?id=61
- https://siyoon210.tistory.com/142
- https://velog.io/@kasania/Java-EnumMap
- https://recordsoflife.tistory.com/890
