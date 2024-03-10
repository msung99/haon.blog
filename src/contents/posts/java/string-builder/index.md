---
title: 자바 String, StringBuilder, StringBuffer 개념
date: "2023-08-18"
tags:
  - JAVA
---

## String 클래스

### 불변의 특징 : "+" 연산

덧셈연산자 "+" 를 사용해서 문자열을 결합하는 것은 **매 연산마다 새로운 문자열을 가진 String 인스턴스를 생성하는 행위**입니다. 때문에 더하기 연산이 많아질경우 메모리공간 낭비가 심해지게 되고, 가능한 문자열 결합횟수를 최소화하는 것이 좋습니다.

### 문자열 비교 : equals() 와 "=="

String 클래스의 생성자를 이용한 경우, new 연산자에 의해서 메모리할당이 이루어지기 때문에 항상 새로운 String 인스턴스가 생성됩니다. 그러나 문자열 리터럴은 **이미 존재하는 것을 재사용**하는 것입니다. 반면 String 클래스를 이용한 경우는 new 연산자에 의해서 메모리할당이 이루어지기 때문에 항상 **새로운 String 인스턴스가 생성**됩니다.

```java
String str1 = "abc"; // str1, str2 는 동일한 "abc" 주소값을 보유
String str2 = "abc";
String str3 = new String("abc"); // str3, str4 는 각자 다른 메모리할당이 이루어짐
Stirng str4 = new String("abc"); // (다른 문자열 인스턴스)

// str1 == str2 -> true
// str1.equals(str2) -> true
// str3 == str4 -> false
// str3.equals(str4) -> true
```

또 문자열 비교시 주의할점은 "==" 와 equals() 를 활용한 비교 방식입니다.  
`"=="` 은 각 String 인스턴스의 주소값을 비교하는 것이며, `equals()` 는 두 문자열 안의 내용자체를 비교하는 것입니다. 때문에 위에서 적어놓은 것처럼 연산의 결과가 나오게 됩니다.

### String 클래스의 메소드들

이어서 String 클래스에서 제공하는 메소드들중에 유용하게 활용 가능한 기능들을 일부 알아봅시다.

| 메소드                         | 설명                                                                                               |
| :----------------------------- | :------------------------------------------------------------------------------------------------- |
| charAt(), contains(), length() | (생략)                                                                                             |
| concat(str)                    | 주어진 문자열 str 을 뒤에 덧붙인다.                                                                |
| indexOf()                      | 주어진 문자열(또는 문자) 가 위치해있는 index 위치값을 반환. 못찾으면 -1 을 반환한다.               |
| compareTo(str)                 | 주어진 문자열과 사전순으로 비교한다. 같으면 0, 사전순으로 이전이면 음수를, 이후면 양수를 반환한다. |
| split(regex)                   | 문자열을 지정된 분리자(regex) 로 나누어 문자열 배열에 담아서 반환한다.                             |
| toLowerCase(), toUpperCase()   | 모든 문자를 소문자/대문자로 변환하여 반환한다.                                                     |
| replace(old, new)              | 문자열 중의 문자(old) 새로운 문자(new) 로 바꾼다.                                                  |
| valueOf()                      | 지정된 값(int, long, float, .. 타입) 을 문자열로 변환하여 반환한다.                                |

### join( )

join() 은 여러 문자열 사이에 구분자를 넣어서 결합합니다. 구분자로 문자열을 자르는 split() 과 반대 역할을 한다고 생각하면 이해하기 쉽습니다.

```java
String animals = "dog,cat,bear";
String[] arr = animals.split(",");
String str = String.join("-:, arr);
```

### String 을 기본형 값으로 변환 : parseInt()

위에서 간략히 설명했기를 `valueOf()` 를 활용하여 기본타입을 문자열로 변환할 수 있었습니다. 반대로 String 을 기본타입으로 변환하려면 `parseInt()` 를 사용하면 됩니다.

```java
int i = Integer.parseInt("100");
float f = Float.parseFloat("1.1");
```

---

## StringBuffer

String 클래스는 인스턴스를 생성할 때 지정된 문자열을 변경할 수 없지만, **StringBuffer 클래스는 문자열 변경작업이 가능**합니다. 내부적으로 문자열 편집을 위한 버퍼(buffer) 를 가지고 있으며, StringBuffer 인스턴스를 생성할 때 그 크기를 지정할 수 있습니다.

이때, 편집할 문자열의 길이를 고려하여 버퍼의 길이를 충분히 잡아주는 것이 좋습니다. 편집중인 문자열이 버퍼의 길이를 넘어서게되면 버퍼의 길이를 늘려주는 작업이 추가로 수행되기 때문에 작업효율이 떨어지기 때문이죠.

### StringBuffer 의 변경작업

![](https://velog.velcdn.com/images/msung99/post/f66a5f11-e59f-46d0-a387-31d09a8ce750/image.png)

```java
StringBuffer sb = new StringBuffer("abc");
sb.append("123");
StringBuffer sb2 = sb.append("ZZ");
```

String 과 달리 StringBuffer 는 변경작업이 가능하다고 했었습니다. 예를들어 "abc" 를 생성했다고 가정해봅시다. 이후 sb 에 문자열을 "123" 을 추가한 후, 이어서 "ZZ" 를 append() 로 추가할때, append() 를 반환타입이 StringBuffer 인데 자신의 주소를 반환합니다. 따라서 sb 에 새로운 문자열이 추가되고 sb 자신의 주소값이 sb2 에게 반환되므로, sb 와 sb2 는 모두 같은 StringBuffer 인스턴스를 가리키게 됩니다.

### StringBuffer 의 비교작업

#### (1) == 와 equals() 는 동일한 작업을 수행한다.

String 클래스에서는 `equals()` 메소드를 오버라이딩해서 문자열의 내용을 비교하도록 구현되어 있지만, StringBuffer 클래스는 `equals()` 메소드를 오버라이딩하지 않아서 **StringBuffer 클래스의 equals 메소드를 사용해도 "==" 연산자로 비교한 것과 같은 결과를 얻습니다.**

```java
StringBuffer sb = new StringBuffer("abc");
StringBuffer sb2 = new StringBuffer("abc");

System.out.println(sb == sb2); // false
System.out.println(sb.equals(sb2)); // false
```

#### (2) String 의 toString() 을 사용해서 내부 문자열을 비교하자.

StringBuffer 인스턴스 내부에 담긴 문자열을 비교하기 위해선 `toString()` 를 호출해서 String 인스턴스를 얻은 다음, 여기에 `equals()` 메소드를 사용해서 비교합시다.

```java
String s1 = sb.toString();
String s2 = sb2.toString();
System.out.println(s1.equals(s2)); // true
```

### StringBuffer 의 기능 및 메소드

| 메소드                                                          | 설명                                                              |
| :-------------------------------------------------------------- | :---------------------------------------------------------------- |
| append(), capacity(), charAt(), length(), reverse(), toString() | (생략)                                                            |
| insert(pos, element)                                            | 지정된 위치(pos) 에 원소(element) 를 삽입한다.                    |
| delete(start, end), deleteCharAt(index)                         | 지정된 범위(start ~ end) 또는 특정 위치(index) 데이터를 삭제한다. |
| substring(start), substring(start, end)                         | 지정된 범위의 부분 문자열을 추출한다.                             |
| reverse()                                                       | 문자열을 거꾸로 뒤집는다.                                         |
| replace(start, end, str)                                        | 주어진 범위의 부분문자열을 새로운 문자열로 대체한다.              |

---

## StringBuilder

### StringBuffer 의 성능이슈

StringBuffer 는 멀티쓰레드에 `안전(Thread Safe)` 하도록 동기화되어 있습니다. 이는 StringBuffer 의 성능을 떨어뜨린다는 특징이 있으며, 멀티쓰레드를 고려하지 않아도 되는 상황인 경우는 StringBuffer 의 동기화 기능은 불필요하게 성능만 떨어뜨리게 됩니다.

### StringBuffer 의 진화

때문에 StringBuffer 에서 쓰레드의 **동기화 기능만 뺀** StringBuilder 가 새롭게 추가되었습니다. **StringBuilder 는 StringBuffer 와 완전히 똑같은 기능으로 작성되어 있습니다.**

```java
// (1) StringBuilder 버전
StringBuffer sb1;
sb1 = new StringBuffer();
sb1.append("abc");

// (2) StringBuffer 버전
StringBuilder sb2;
sb2 = new StringBuilder();
sb2.append("abc");
```

위 코드에서 (1) 과 (2) 는 StringBuilder 로 구현되어 있는 코드인가, StringBuffer 로 구현되어 있는가의 차이입니다. 생성부분을 제외하면 모든 부분이 동일합니다.

---

## 참고

- 자바의 정석 (3rd Edition)
- https://onlyfor-me-blog.tistory.com/317
