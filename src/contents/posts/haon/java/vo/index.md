---
title: VO(Value Object) 란 무엇이고, 캡슐화를 통해 얻는 이점은 무엇인가?
date: "2024-07-05"
tags:
  - JAVA
  - VO
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## VO(Value Object)

VO 는 도메인에서 1개 또는 그 이상의 속성들을 묶어서 특정 값을 나타내는 객체입니다. 도메인 객체의 일종이고 보통 PK 로 식별값을 가지는 엔티티(Entity) 와 구분해서 사용합니다. 그렇다면 VO 는 어떤 조건들에 의해 엔티티와 구분되는지 알아봅시다.

---

## VO 의 규약사항

```java
public class MYCLASS {
    private final String path;

    private Bridge(String bridgePath){
        this.path = bridgePath;
    }

    @Override
    public boolean equals(Object object){
        if(object == this) {
            return true;
        }
        if(object == null || getClass() != object.getClass()) {
            return false;
        }

        MYCLASS otherPath = (MYCLASS) object;
        return path.equals(otherPath.path);
    }

    @Override
    public int hashCode(){
        return Objects.hash(path);
    }
}
```

### 1. 불변성(immutable)

VO 는 수정자(setter) 를 가지지 않습니다. 즉, VO 는 불변하다는 특징이 있기 떄문에 내부의 모든 필드는 `final` 로써 변경되지 않음을 보장하게 됩니다.

불변성으로 인해, VO 는 언제 어디서 호출되던간에 값이 변경되지 않음이 보장됩니다. 예를들어 DB 에서 가져온 데이터를 VO 에다 담는다면 항상 VO 의 값의 무결성을 보장하게 되고, 데이터에 대한 신뢰도가 높아지게 됩니다.

보듯이 Bridge 는 `final` 로써 모든 필드의 불변성을 보장했습니다. 만약 필드의 변경을 원할시엔, 별도의 setter 가 없고 대신에 새로운 인스턴스를 생성하고 반환하는 방식으로 구성했습니다.

### 2. 동등성(equality)

두 객체가 실제로 다른 객체이더라도, 즉 `동일성(identity)` 를 갖지 않더라도 논리적으로 표현하는 값이 같다면 `동등성(equality)` 를 갖습니다. 예를들어 스타벅스 서울점과 인천점에서 각각 만든 아메리카노가 있다고 해봅시다. 이들은 서로 엄연히 다른 객체(물체)이지만, 동등한 가치를 지니므로 논리적으로 "동등하다" 라고 할 수 있습니다.

떄문에 **"`equals()` 와 `hashCode()` 를 재정의하라"** 라는것도 이에 딱 들어맞는 사항입니다. 타입도 같고, 내부의 속성값도 같은 두 VO 객체가 있다면 실제로도 같은 객체로 취급하고 싶을텐데, 이러한 동등성 비교를 Equals 메소드를 재정의함으로써 가능해집니다.

> equals 의 자세한 재정의 규약은 [[JAVA] Object.equals 의 일반 규약을 지켜서 재정의하라](https://velog.io/@msung99/JAVA-Object.equals-%EC%9D%98-%EC%9D%BC%EB%B0%98-%EA%B7%9C%EC%95%BD%EC%9D%84-%EC%A7%80%EC%BC%9C%EC%84%9C-%EC%9E%AC%EC%A0%95%EC%9D%98%ED%95%98%EB%9D%BC) 을 참고하자.

### 3. 자가 유효성 검사(Self-Vadlidation)

VO 는 자기 유효성 검사라는 특징을 갖습니다. 만약 `int`, `double` 과 같은 원시타입을 사용하면 사용하는 측에서 일일이 직접 검사해줘야합니다. 하지만 원사타입을 VO 로 `래핑(Wrapping)` 하면서 객체를 생성한다면, 유효성 체크가 용이해집니다.

모든 유효성 검사는 VO 객체 생성 시간에 이루어져야 하며, 떄문에 유효하지 않은 값으로 VO 를 생성할 수 없습니다. 따라서 VO 를 사용하는 클라이언트 입장에선 도메인 규칙이 꺠진다는 걱정없이 마음껏 VO 과 그 내부의 값을 사용할 수 있게됩니다.

---

## 원시타입(Primitive Obsession) 을 VO 로 래핑함으로써 얻는 이점

### 원시타입에 비해 값에 대한 신뢰성이 올라간다.

원시타입, 즉 `int`, `float`, `double` 과 같은 원시타입을 VO 로 얻는 이점에는 무엇이 있을까요? 우선 앞서 간접적으로 언급했기를, `유효성 검사` 를 거친 데이터를 활용하므로, 사용하는 입장에서 값에 대한 신뢰성을 보장할 수 있을겁니다.

또 `불변성` 으로 인해 실수로 로직을 잘못 설계하여 값을 함부로 변경하는 행위를 방지할 수 있으며, 동일한 타입에 대해서만 `동일성` 을 비교할 수 있게됩니다. 즉, 실수로 다른 타입끼리의 값을 변경하는 상황을 방지할 수 있습니다.

### 비즈니스 규칙을 포함할 수 있다.

이어지는 맥락으로, `DTO` 와 달리 VO 는 `비즈니스 로직`을 포함하게 되므로 주어진 상황에서 검증 과정을 거칠 수 있게됩니다. 예를들어 사람의 나이를 표현하는 VO 인 Age 가 있고, 이 나이값에 할당되는 값이 최대로 150살이 넘어 가는 상황은 비정상적일 겁니다. 떄문에 150살을 제한사항으로 비즈니스 정책을 세웠을떄, VO 객체를 생성시 이에 대한 검증을 수행할 수 있게됩니다. 이는 앞서 언급한 "유효성 검사" 와도 비슷한 맥락입니다

### 더 의미있는 값을 지닐 수 있다.

DTO 가 단순히 계층간 데이터 전송을 위한 것이라면, VO 는 도메인 계층에 위치하여 더 "유의미한" 값을 표현할 수 있습니다. 예를들어 "계좌 잔액" 과 같은 값을 원시타입 대신에 VO 로 래핑하여 위와 같은 규악사항들을 준수한다면, 분명 더욱이 도메인 객체로써 충분히 중요한 역할을 할 수 있게 됩니다.

요약하자면, **VO 를 통해 도메인을 설게하면 객체가 생성될 때 해당 객체안에 제약사항 및 중요한 정책사항을 추가할 수 있습니다.**

---

## 더 학습해볼 키워드

- 동일성(identity) 과 동등성(eqality)

---

## 참고

- https://hudi.blog/value-object/
- https://tecoble.techcourse.co.kr/post/2020-06-11-value-object/
