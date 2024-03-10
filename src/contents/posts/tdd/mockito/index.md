---
title: Mocktio 란 무엇이고, 어떻게 사용하는걸까?
date: "2024-01-11"
tags:
  - TDD
  - Mockito
previewImage: test.png
---

Mockito 는 모의 객체 생성 검증, 스텁을 지원하는 프레임워크이다. 지금은 모의 객체에 대한 자세한 설명을 생략하고, 기본 사용법에 대해 중점으로 다룰 것이다. 추후 포스트에서 대역에 대한 전반 내용을 다룰 때 이론을 더 다루고자 한다.

---

## 모의 객체 생성

우선 `Mockito.mock()` 메소드를 이용하면 특정 타입의 모의 객체를 생성할 수 있다.

```java
public class GameGenMockTest {
    @Test
    void mockTest() {
        GameNumGen genMock = Mockito.mock(GameNumGen.class);
    }
}
```

---

## 스텁 설정

모의 객체를 생성한 뒤에는 BDDMockito 클래스를 이용해서 모의 객체에 "스텁(Stub)"을 구성할 수 있다. 스텁이란 인스턴스화하여 구현한 가짜 객체(Dummy, 기능 구현이 없음) 를 이용해 실제로 동작하는 것처럼 보이게 만드는 객체이다. `BDDMockito.given()` 메소드를 이용하면 모의 객체의 메소드가 특정 값을 리턴하도록 설정할 수 있다.

### BDDMocktio

```java
public class GameGenMockTest {
    @Test
    void mockTest() {
        GameNumGen genMock = Mockito.mock(GameNumGen.class);
        BDDMockito.given(genMock.generate(GameLevel.EASY)).willReturn("123"); // (1)

        String num = genMock.generate(GameLevel.EASY); // (2)
        Assertions.assertEquals("123", num);
    }
}
```

위 코드에서 `BDDMockito.given()` 메소드는 스텁을 정의할 모의 객체의 메소드 호출을 전달한다.

#### willReturn

`given()` 메소드에 이어 `willReturn()` 으로 스텁을 정의한 메소드가 리턴할 값을 지정한다.

즉, 위 코드의 경우 `(1)` 에서 genMock.generate(GameLevel.EASY) 메소드가 불리면 "123" 을 리턴하도록 설정한 것이다. 또 `(2)` 에선 모의 객체의 `generate()` 메소드를 실행한다. 이때 인자로 GameLevel.EASY 를 전달하고 있는데, 이는 `(1)` 의 given() 에서 지정한 메소드 인자와 일치하므로 genMock.generate(GameLevel.EASY) 코드는 "123" 을 리턴한다.

#### willThrow

지정한 값을 리턴하는 대신에 Exception 을 터뜨리고 싶다면 `willThrow()` 를 사용하면 된다.

```java
@Test
void mockTest2() {
	GameNumGen genMock = Mockito.mock(GameNumGen.class);
    BDDMockito.given(genMock.generate(GameLevel.EASY)).willThrow(IllegalArgumentException.class);

    Assertions.assertThrows(IllegalArgumentException.class, () -> genMock.generate(null));
}
```

위 예제를 보면 Mock 객체가 willThrow() 를 통해 예외를 터뜨리는 모습을 볼 수 있다.

```java
@Test
void mockTest3() {
	List<String> mockList = Mockito.mock(List.class);
    BDDMockito.willThrow(IllegalArgumentException.class).given(mockList).clear();

    Assertions.assertThrows(IllegalArgumentException.class, () -> mockList.clear());
}
```

`BDDMockito.willThrow()` 메소드는 발생한 예외 타입이나 예외 객체를 파라미터로 전달받는다. `given()` 메소드는 모의 객체를 전달받는다. 모의 객체의 메소드 실행이 아닌 모의 객체임에 유의하자.

`given()` 메소드는 인자로 전달받은 모의 객체 자신을 리턴하는데 이떄 예외를 터뜨릴 메소드를 설정한다.

위 예제를 더 해석해보면, 모의 객체인 mockList 의 타입을 보면 `List` 이다. mockito 객체의 내장함수, 즉 List 타입의 내장 함수인 `clear()` 를 호출하는 경우 IllegalArgumentException 예외가 터지도록 설정한 것이다.

---

## 인자 매칭 정리

```java
BDDMockito.given(mock.generate(GameLevel.EASY)).willReturn("123");
String num = mock.generate(GameLevel.NORMAL);
```

위 코드는 스텁을 설정할 때 `generate()` 의 인자로 GameLevel.EASY 를 전달하고 있는데, 실제로 generate() 메소드를 호출할 때는 GameLevel.NORMAL 을 인자로 전달했다. 이 경우 mock.generate(GameLevel.NORMAL) 코드는 스텁을 설정할 때 사용한 인자와 일치하지 않으므로 null 을 리턴한다.

### ArgumentMatchers

ArgumentMatchers 클래스를 사용하면 정확하게 일치하는 값 대신 임의의 값에 일치하도록 설정할 수 있다.

```java
@Test
void mockTest4() {
	GameNumGen mock = Mockito.mock(GameNumGen.class);
    // (1)
    BDDMockito.given(mock.generate(ArgumentMatchers.any())).willReturn("456");
    String num = mock.generate(GameLevel.EASY); // (2)
    Assertions.assertEquals("456", num);

    String num2 = mock.generate(GameLevel.NORMAL); // (3)
    Assertions.assertEquals("456", num2);
}
```

`(1)` 에서 스텁을 설정할 때 `ArgumentMatchers.any()` 메소드를 파라미터로 전달했다. any() 메소드를 사용하면 모든 값에 일치하도록 스텁을 설정한다. `(2)`, `(3)` 의 `generate()` 메소드는 모두 "456" 을 리턴한다.

#### ArgumentMatcher 의 세부 메소드들

ArgumentMatcher 가 제공하는 세부 기능(메소드) 들은 다음과 같다.

- 기본 원시타입에 대한 임의 값 일치 : anyInt(), anyLong(), anyChar(), anyDouble(), ...

- 임의 타입에 대한 일치 : any()

- 임의 컬렉션에 대한 일치 : anyList(), anySet(), anyMap(), anyCollection()

- 정규표현식을 이용한 String 값 일치 여부 : matches(String), matches(Pattern)

- 특정 값과 일치 여부 : eq(값)

ArgumentMatchers 의 `anyInt()` 나 `any()` 등의 메소드는 내부적으로 인자의 일치 여부를 판단하기 위해 ArgumentMatchers 를 등록한다. Mockito 는 한 파라미터라도 ArgumentMatchers 를 사용해서 설정한 경우, 모든 인자를 ArgumentMatchers 를 이용해서 설정하도록 하고있다.

```java
@Test
void mockTest5() {
	List<String> mockList = Mockito.mock(List.class);

    BDDMockito.given(mockList.set(ArgumentMatchers.anyInt(), ArgumentMatchers.eq("123"))).willReturn("456");

    String old = mockList.set(5, "123");
	Assertions.assertEquals("456", old);
}
```

임의의 값과 일치하는 인자와 정확하게 일치하는 일치하는 인자를 함께 사용하고싶다면 `ArgumentMatchers.eq()` 를 사용하자.

---

## 행위 검증

```java
@Test
void mockTest6() {
	GameNumGen mock = Mockito.mock(GameNumGen.class);
    Game game = new Game(mock);
    game.init(GameLevel.EASY);

    BDDMockito.then(mock).should().generate(GameLevel.EASY);
}
```

모의 객체의 역할 중 하나는 실제로 모의 객체가 호출됐는지 검증하는 것이다. 모의 객체의 특정 메소드가 호출되었는지 확인하는 코드는 위와 같다.

`BDDMockito.then()` 은 메소드 호출 여부를 검증할 모의 객체를 전달받는다. `should()` 메소드는 모의 객체의 메소드가 호출되어야 한다는 것을 설정하고 should() 메소드 다음에 실제로 불려야 할 메소드를 지정한다. 위 예제에서 mock 객체의 generate() 메소드가 GameLevel.EASY 인자를 사용해서 호출되었는지를 검증한다.

```java
BDDMockito.then(mock).should().generate(any());
```

만약 이때 GameLevel.EASY 처럼 정확한 값이 아니라 메소드 호출 여부가 중요하다면 any(), anyInt() 등을 사용해서 인자를 지정하면 된다.

```java
BDDMockito.then(mock).should(ArgumentMatchers.only()).generate(ArgumentMatchers.any());
```

정확하게 1번만 호출된 것을 검증하고 싶다면 should() 메소드에 Mockito.only() 를 인자로 전달한다.

---

## 더 학습해볼 키워드

- 인자 캡쳐
