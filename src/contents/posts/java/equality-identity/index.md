---
title: 자바 객체의 동일성(identity)와 동등성(equality)
date: "2023-09-13"
tags:
  - JAVA
  - 동등성
---

## 학습배경

최근 우테코 프리코스에 참여하면서, `동일성(identity)` 와 `동등성(equality)` 라는 키워드에 대해 처음 접하게 되었습니다. 이들에 대한 이해도가 부족하다고 생각이 들었기때문에, 이번 기회에 학습해보고자 합니다.

---

원활한 설명을 위해, 우선 아래와 같은 사용자 정의 클래스를 정의했다고 가정하겠습니다.

```java
class Position {
  private int currentPosition;

  Position(int currentPosition){
    this.currentPosition = currentPosition;
  }
}
```

## 동일성 (Identity)

동일성은 **두 비교대상이 바라보고 있는 실제 인스턴스 객체의** `메모리 주소` **가 같음을 의미하는 것 입니다.** 동일성에 대한 비교는 `==` 비교연산자로 확인할 수 있게됩니다.

```java
Position pos1 = new Position(10);
Position pos2 = pos1;
System.out.println(pos1 == pos2); // true
```

예를들어 위 코드에서 pos2 를 생성시에 새로운 인스턴스를 생성하는 것이 아니라, 기존 객체인 pos1 를 대입받았습니다. 이 결과로 pos1 과 pos2 이 같은 **메모리 주소에 위치한 같은 인스턴스를 바라보게 됩니다.** 객체는 각자의 고유한 식별자를 가지고 있는데, 이 식별자가 같으면 동일하다고 판단하게 됩니다.

---

## 동등성(equality)

반면 동등성은 비교 대상의 두 객체가 **논리적으로 동일한 값을 저장 및 표현하고 있는지를 의미하는 것**입니다. 쉽게말해, 메모리 주소값을 비교하는 것이 아니라 **"논리적으로 동일한지"** 를 비교하는 것입니다. 동등성 비교를위해, 자바에선 `equals()` 와 `hashCode()` 를 재정의해야합니다.

예를들어 지갑에 100원이 있고 집에 100원이 있다고 해봅시다. 분명히 둘은 엄연히 다른 객체(물체) 이기 떄문에 `동일성` 에 있어선 서로 다른 객체라는 결과를 얻게됩니다. 반명 둘은 논리적으론 100원이라는 면에선 같은 동전이므로, `동등성`의 결과로는 같은 객체라는 결과를 얻게됩니다.

```java
public class Bridge {
    private final String path;
    // ... (생략)

    @Override
    public boolean equals(Object object){
        if(object == this) {
            return true;
        }
        if(object == null || getClass() != object.getClass()) {
            return false;
        }

        Bridge otherPath = (Bridge) object;
        return path.equals(otherPath.path);
    }

    @Override
    public int hashCode(){
        return Objects.hash(path);
    }
}
```

만약 2개의 Bridge 라는 VO 가 있을때, 이 둘을 `equals()` 와 `hashCode()` 를 재정의후 둘의 path 필드가 동일하다면 동일하다는 결과를 도출해내는 것은 `동등성(equality)` 이 보장된 것입니다.

---

## hashCode 는 왜 재정의 해야하는가?

### hashCode

우선 hashCode 에 대해 이해할 필요가 있습니다. 객체의 `hashCode` 란 **객체를 식별하는 하나의 고유 정수값**을 말합니다. `Object.hashCode()` 메소드가 객체의 hashCode 를 반환하는 것이며, 이 메소드는 객체의 메모리 버전을 이용해서 hashCode 를 만들어 반환하기 때문에, **각 객체마다 고유한 다른 해시코드 값을 가집니다.**

따라서 객체의 `동일성` 이 아니라 논리적인 `동등성` 을 비교할시엔 `hashCode()` 를 오버라이딩할 필요가 있습니다. 자바의 컬렉션에서 **HashSet, HashMap, HashTable 같은 경우도 두 객체가 동등한지 논리적 동등성을 비교하기 떄문입니다.**

### equals() 와 hashCode() 를 함께 재정의해야 하는 이유

본론으로 돌아가서, 왜 `equals()` 와 `hashCode()` 중에 하나만 재정의하면 어떻게될까요?

![](https://velog.velcdn.com/images/msung99/post/69219e7d-a257-423f-b9a7-b1c33c22e86e/image.png)

우선 논리적 동등성을 비교시, hash 값을 사용하는 컬렉션(HashSet, HashMap, HashTable) 은 객체가 논리적으로 동일한지 비교시 `hashCode()` 값을 먼저 비교하고, 이후에 `equals()` 를 비교하게 됩니다. 이 둘의 결과가 모두 true 라면 논리적으로 동일하다고 판별하게 됩니다.

또 `Object.hashCode()`는 객체의 고유한 주소값을 int 값으로 해싱하여 변환하므로, 객체마다 다른 값을 리턴합니다. 따라서 해싱 기반 컬렉션에 저장된 서로 다른 두 객체를 비교시, 해싱된 값이 다르므로 논리적으로 다르다고 판단되는 방식입니다.

#### hashCode() 만 재정의하고, equals() 는 재정의 안한 경우

만약 `hashCode()` 만 재정의한다면 `hashCode()` 가 만든 해시값을 이용해 컬렉션에 객체가 저장된 버킷을 찾을순 있습니다. 그러나 해싱된 값이 동일해도 `equals()` 로 비교시에 논리적으로 서로 같은 객체인지 판별할 수 없기 때문에 `null` 이 반환됩니다. 즉, **논리적 동일성을 비교할 수 없으므로** 원하는 객체를 찾을 수 없게됩니다.

#### equals() 만 재정의하고, hashCode() 는 재정의 안한 경우

반대로 `equals()` 만 재정의한다면 같은 VO 라도 컬렉션에 저장된 각 객체마다 해시코드 값이 달라지므로, `hashCode()` 반환값이 다르기때문에 동일한 VO 의 동일성이 false 가 나오게됩니다.

### hashCode 재정의 방법

```java
@Override
    public int hashCode() {
        return Objects.hash(name);
    }
```

인텔리제이와 같은 IDEA 에서 제공하는 기능을 사용하면, `Objects.hash` 메소드를 호출하는 로직으로 hashCode 메소드를 재정의해줍니다. Objects.hash 메서드는 hashCode 메서드를 재정의하기 위해 간편히 사용할 수 있는 메서드이지만 속도가 느립니다. 인자를 담기 위한 배열이 만들어지고 인자 중 기본 타입이 있다면 박싱과 언박싱도 거쳐야 하기 때문이죠.

따라서 성능에 민감하지 않은 경우라면 `Object.hash` 로 간편하게 재정의하되, 민감한 경우만 직접 재정의해줍시다. 참고로 대부분의 프로그램은 `Objects.hash` 를 활용하여 재정의해도 문제 없습니다.

> 직접 오버라이딩을 하는 경우는, 벨덤의 가이드라인 [Guide to hashCode() in Java](https://www.baeldung.com/java-hashcode) 을 참고하자.

---

## 참고

- https://hudi.blog/identity-vs-equality/
- https://velog.io/@mooh2jj/equals와-hashCode는-언제-사용하는가
- https://steady-coding.tistory.com/534
