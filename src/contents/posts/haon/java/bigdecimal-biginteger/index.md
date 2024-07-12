---
title: 자바의 BigDecimal, BigInteger
date: "2023-08-30"
tags:
  - JAVA
  - BigInteger
  - BigDecimal
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## BigInteger

BigInteger 는 int 와 long 원시타입이 표현할 수 있는 범위보다 훨씬 큰 정수를 표현하기 위한 클래스입니다. 특히 long 으로 8Byte 나 표현 가능하므로 일반적인 모든 숫자를 대응할 수 있겠지만, 금액과 같은 신중한 값을 표현해야하는 상황에선 혹시모를 상황에 대비해야합니다.

### 생성

BigInteger 는 long 형으로 다룰수없는 범위를 숫자를 다루기 떄문에, 보통은 문자열로 생성하는 것이 일반적입니다. 단, 비교적 작은 숫자를 생성하고 싶다면 `valueOf()` 정적 팩토리 메소드를 사용하여 int 혹은 long 타입의 값을 전달할 수 있습니다.

```java
// 문자열로 생성
BigInteger bigInteger1 = new BigInteger("99999999999999999999");

// n진수 문자열로 생성 -> n진수 형태로 생성하더라도 10진수로 자동변환되어 표현
BigInteger bigInteger2 = new BigInteger("FFFF", 16);

// valueOf 생성
BigInteger bigInteger3 = BigInteger.valueOf(10000L);
BigInteger bigInteger4 = BigInteger.valueOf(Integer.MAX_VALUE);
```

### 연산 메소드

BigInteger 는 int, long 와 같은 원시타입이 아니기 떄문에 사칙연산자( +, -, \*, / ) 를 사용할 수 없으며, 대신 사칙연산을 위한 메소드를 사용하여 연산 가능합니다. 이때 BigInteger 는 정수를 표현하기 때문에 나숫셈 연산 결과에서 소수점은 버려집니다.

```java
System.out.println(bigInteger1.add(bigInteger2));
System.out.println(bigInteger1.substract(bigInteger2));
System.out.println(bigInteger1.multiply(bigInteger2));
System.out.println(bigInteger1.divide(bigInteger2));
System.out.println(bigInteger1.mod(bigInteger2));
```

### 연산시 유의사항

**또, BigInteger 는 불변성을 가지고있다는 특징이 있습니다. 때문에 연산 메소드를 사용시 객체 내부의 값이 변경되지않고, 연산 결과값을 갖는 새로운 객체가 생성되어 반환됩니다.** 따라서 성능 저하의 원인이 될 수 있으니 조심해야합니다.

### 형변환

원하는 타입으로도 형변환이 가능합니다. `int`, `long` 뿐만 아니라 `float` 와 `double` 과 `String` 형으로도 모두 변환 가능합니다.

```java
BigInteger bigNumber = BigInteger.valueOf(10000);

int intNumber = bigNumber.intValue();
float floatNumber = bigNumber.floatValue();
String stringNumber = bigNumber.toString();
```

### 대소비교

사칙연산과 마찬가지로 "==" 와 같은 연산이 불가능하고, `compareTo()` 메소드로 대소비교가 가능합니다. `compareTo()` 에 대한 자세한 설명은 [[JAVA] Comparator 과 Comparable 인터페이스는 어떻게 사용해야할까?](https://velog.io/@msung99/JAVA-Comparator-%EA%B3%BC-Comparable-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4) 은 참고해도 좋을듯합니다.

```java
BigInteger num1 = BigInteger.valueOf(10);
BigInteger num2 = BigInteger.valueOf(3);

System.out.println(num1.compareTo(num2)); // 양수 반환
```

### 상수

추가적으로 BigInteger 는 아래처럼 자주 사용하는 숫자를 상수로 미리 정의해두었습니다.

```java
System.out.println(BigInteger.ZERO); // 0
System.out.println(BigInteger.ONE); // 1
// (TWO THREE ... NINE)
System.out.println(BigInteger.TEN); // 10
```

---

## BigDecimal

`BigInteger` 가 정수를 표현하기 위한 것이라면, `BigDecimal` 은 실수를 표현하기 위한 것입니다. `double` 이나 `float` 원시타입들은 대부분의 연산에서 오차를 보이곤하는데, 미세한 값을 사용하거나 값의 오차가 발생하면 안되는 경우에 `BigDecimal` 을 사용하면 유용합니다. 원시타입보단 조금 느리지만, 매우 정밀한 결과값을 보장합니다.

### 생성

`BigDecimal` 은 `BigInteger` 와 달리 원시타입 float, dobule 을 생성자에 바로 넣어 생성할 수 있습니다. 하지만 생성자로 바로 원시타입을 주입하면 오차가 발생할 수 있기때문에, `BigDecimal` 도 문자열로 표현하는 것이 일반적입니다.

```java
// 문자열로 생성
BigDecimal bigDecimal1 = new BigDecimal("1.23");
System.out.println(bigDecimal1); // 1.23

// double 형으로 생성
BigDecimal bigDecimal2 = new BigDecimal(1.23);
System.out.println(bigDecimal2); // 1.2300000000000000001928382712

// int, long 형으로 생성
BigDecimal bigDecimal3 = new BigDecimal(123);

// valueOf 로 생성
BigDecimal bigDecimal4 = BigDecimal.valueOf(123);
```

### 기본 연산

BigInteger 와 마찬가지로 직접적인 연산이 불가능하고, 메소드를 사용해야 합니다. 이때 나눗셈 연산은 주의해야합니다. 나숫셈의 결과가 무한소수라면, `ArithmeticException` 예외가 발생합니다.

```java
bigDecimal1.add(bigDecimal2);
bigDecimal1.substract(bigDecimal2);
bigDecimal1.multiply(bigDecimal2);
bigDecimal1.divide(bigDecimal2); // ArithmeticException 예외가 발생할 수도 있다.
bigDecimal1.remainder(bigDecimal2);
```

### 올림, 내림, 반올림 연산

이어서 올림, 내림, 반올림 등의 소수점 처리 연산을 제공합니다. `setScale()` 메소드에 반올림할 소수점 아래 자리수와, 소수점 처리 방식을 전달하면 됩니다. 소수점 처리 방식은 `RoundingMode` 라는 클래스의 상수로 정의되어있습니다.

```java
BigDecimal bigNumber = new BigDecimal("1.25");

// 올림
System.out.println(bigNumber.setScale(1, RoundingMode.CEILING)); // 1.3
// 내림
System.out.println(bigNumber.setScale(1, RoundingMode.FLOOR)); // 1.2
// 반올림
System.out.println(bigNumber.setScale(1, RoundingMode.HALF_UP)); // 1.3
// 반내림
System.out.println(bigNumber.setScale(1, RoundingMode.HALF_DOWN)); // 1.2
```

### RoundingMode 를 활용한 무한대 소수점 처리

앞서 언급했듯이, 나눗셈 연산은 `ArithmeticException` 에 예외가 터지는것에 대한 유의가 필요합니다. 이 문제를 해결하기위해 `divide()` 의 인자로 `RoundingMode` 를 전달하면 예외가 발생하지 않습니다.

```java
BigDecimal num1 = new BigDecimal(10);
BigDecimal num2 = new BigDecimal(3);
System.out.println(num1.divide(num2, RoundingMode.CEILING));
```

### 비교연산

마찬가지로 `comapreTo()` 를 활용하면 됩니다.

```java
System.our.println(bigDecimal1.compareTo(bigDecimal2)); // 양수, 0, 음수중에 반환
```

### 형변환

마찬가지로 int, long, float, double, String 등의 다양한 타입으로 형변환이 가능합니다.

```java
BigDecimal bigDecimal = BigDecimal.valueOf(1000.123); // double -> BigDeicmal
bigDecimal.intValue();
bigDecimal.floatValue();
bigDecimal.toString();
```

### equals() 와 compareTo() 의 구분

```java
BigDecimal num1 = new BigDecimal("1.10");
BigDecimal num2 = new BigDecimal("1.1");

System.out.prinln(num1.equals(num2)); // false
System.out.prinln(num1.compareTo(num2)); // true
```

`equals()` 는 BigDecimal 의 `scale()` 값까지 같아야 true 를 반환합니다. 1.10 과 1.1 은 논리적으로 같은 값일지라도, 소수점아래 자릿수가 다르므로 결과는 false 가 나옵니다. 둘을 같은수로 보고싶다면 `compareTo()` 를 활용하면 됩니다.

---

## 더 학습해볼 키워드

- [DecimalFormat](https://reakwon.tistory.com/156)

---

## 참고

- Effective Java (Joshua Bloch 지음)
- https://tecoble.techcourse.co.kr/post/2021-04-26-BigInteger_BigDecimal/
- https://velog.io/@hgo641/BigDecimal%EC%9D%84-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90
- https://hudi.blog/java-biginteger-bigdecimal/
