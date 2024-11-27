---
title: 자바 컬렉션(Collection) 의 개념과 종류
date: "2024-07-02"
tags:
  - JAVA
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 학습배경

이번 포스팅은 각 컬렉션의 세부적인 기능 및 메소드 사용법을 살펴보는 것이 아닙니다. 각 컬렉션의 특징과 핵심 기능만을 다룹니다.

---

## 컬렉션의 핵심 인터페이스

컬렉션을 사용해봤다면 아래의 인터페이스들을 살펴봤을겁니다. 각 특징을 분석해보면 아래와 같습니다. 가장 큰 구분특징은 "순서유지", "중복허용" 으로 구분지었습니다.

| 인터페이스 | 설명                                                                                         | 구현 클래스                             |
| :--------- | :------------------------------------------------------------------------------------------- | :-------------------------------------- |
| List       | 순서를 유지하며, 중복을 허용한다.                                                            | ArrayList, LinkedList, Stack, Vector    |
| Set        | 순서를 유지하지 않으며, 중복을 허용하지 않음                                                 | HashSet, TreeSet                        |
| Map        | key-value 쌍으로 구성. 순서를 유지하지 않고, key 는 중복을 허용하지 않고, value 는 허용한다. | HashMap, TreeMap, HashTable, Properties |

이 중에 과거 컬렉션 프레임워크가 개발되기 전부터 존재한 Vector, HashTable 과 같은 컬렉션 클래스들은 가능하면 사용하지 않는것이 좋습니다. 그 대신 새로 추가된 ArrayList 와 HashMap 을 사용합시다.

### Collection 인터페이스

**List 와 Set 의 조상인 Collection 인터페이스**는 아래와 같은 메소드들이 정의되어 있습니다. 충분히 유추할 수 있는것들은 설명을 생략했습니다.

| 인터페이스                | 설명                                                                                      |
| :------------------------ | :---------------------------------------------------------------------------------------- |
| add(), addAll()           | (생략)                                                                                    |
| contains(), containsAll() | 해당값(또는 값들)이 리스트에 포함되어있는지                                               |
| equals()                  | 동일한 Collection 인지 비교                                                               |
| hashCode()                | 컬렉션의 해시코드를 반환                                                                  |
| isEmpty()                 | (생략)                                                                                    |
| iterator()                | 컬렉션의 iterator 를 얻어서 반환한다.                                                     |
| remove(), removeAll()     | (생략)                                                                                    |
| retainAll()               | 파라미터로 넘겨진 컬렉션에 포함된 객체들만 남기고 다른 객체들은 모두 컬렉션에서 삭제한다. |
| size()                    | (생략)                                                                                    |
| toArray()                 | (생략)                                                                                    |
| sort()                    | (생략)                                                                                    |

---

## List

그럼 지금부터 List 의 각 구현체의 특징에 대해 깊게 살펴봅시다. List 의 구현체로 ArrayList, Vector, LinkedList 를 살펴볼겁니다. 또 앞서 언급했듯이, 각 구현체의 자세한 메소드 기능설명은 하지않고 핵심 기능만 살펴보면서 각 구현체의 특징을 비교해볼겁니다.

### ArrayList (w. Vector)

```java
List list1 = new ArrayList(10);
```

ArrayList 는 List 인터페이스를 구현하기 때문에 **데이터의 저장순서가 유지**되고 **중복을 허용**한다는 특징을 지닙니다. 기존 Vector 를 개선한 컬렉션으로, Vector 와 구현원리와 기능적인 측면에서 동일합니다. Vector 는 단지 기존에 작성된 소스와의 호환성을 위해서 계속 남겨두고 있을 뿐이기 때문에, **Vector 보다는 ArrayList 의 사용을 지향합시다.**

#### 저장할 데이터의 개수를 고려하자.

ArrayList 나 Vector 는 Object[] 배열을 이용해서 데이터를 순차적으로 저장합니다. 그러다 **배열에 더 이상 저장할 공간이 없으면, 큰 배열을 생성해서 기존의 배열에 저장된 내용을 새로운 배열로 복사한 다음에 저장합니다.**

때문에, ArrayList 와 Vector 와 같이 배열을 이용한 자료구조는 처음에 인스턴스를 생성시 저장할 데이터의 개수를 잘 고려하여 충분한 용량의 인스턴스를 생성하는 것이 좋습니다. 더 많은 객체를 저장하면 자동적으로 크기가 늘어나기는 하지만, 이 과정에서 처리시간이 많이 포함되기 때문입니다.

#### 배열의 한계(단점)

배열은 구조가 간단하며 사용하기 쉽고 데이터를 조회시간이 가장 빠르다는 장점을 가지고 있습니다. 하지만 아래와 같은 단점도 존재합니다.

> - 1.크기 변경이 불가능하다.

- 2.비순차적인 데이터의 추가 또는 삭제에 시간이 많이 걸린다.

크기를 변경할 수 없으므로, 새로운 배열을 생성해서 복사해야한다는 얘기는 앞서 설명했습니다. 또 실행속도를 향상시키기 위해서는 충분히 큰 크키의 배열을 생성해야 하므로, 메모리가 낭비됩니다. 또한 차례대로 추가하고 마지막에서붙 데이터를 삭제하는 연산은 정말 빠릅니다. 하지만 배열의 중간에 데이터를 추가하라면, 빈자리르 만들기위해 다른 데이터를 복사해서 이동해야합니다.

#### ArrayList 메소드 기능명세

ArrayList 에서 제공하는 메소드 및 기능을 살펴보면 아래와 같습니다. 계속 언급했듯이, 자세한 코드 예시는 생략합니다.

| 기능                  | 설명                                                                                      |
| :-------------------- | :---------------------------------------------------------------------------------------- |
| add(), addAll()       | (생략)                                                                                    |
| contains()            | 해당값(또는 값들)이 리스트에 포함되어있는지                                               |
| clear()               | 동일한 Collection 인지 비교                                                               |
| clone()               | 컬렉션의 해시코드를 반환                                                                  |
| **ensureCapacity()**  | ArrayList 의 용량이 최소한 minCapacity 가 되도록 한다.                                    |
| get()                 | 지정된 위치(index) 에 저장된 객체를 반환                                                  |
| remove(), removeAll() | (생략)                                                                                    |
| **retainAll()**       | 파라미터로 넘겨진 컬렉션에 포함된 객체들만 남기고 다른 객체들은 모두 컬렉션에서 삭제한다. |
| size()                | (생략)                                                                                    |
| toArray()             | (생략)                                                                                    |
| sort()                | (생략)                                                                                    |
| **trimToSize()**      | 용량을 크기에 맞게 줄인다. (빈 공간을 없앤다)                                             |
| **indexOf()**         | 지정된 객체가 저장된 위치를 찾아 반환                                                     |
| **lastIndexOf()**     | 지정된 객체가 저장된 위치를 끝부터 역방향으로 검색해서 반환                               |
| **set()**             | 주어진 객체를 지정된 위치(index) 에 저장                                                  |

### LinkedList

![](https://velog.velcdn.com/images/msung99/post/a8782f70-a50d-4fed-9fbb-bc08c4d8f57e/image.png)

앞서 언급한 배열의 한계를 보완하도록, **더블리 링크드리스트** 구조의 LinkedList 컬렉션을 도입했습니다. ArrayList 와 비교해봤을때, 어떤 상황에서 무엇이 더 유리할지를 정리해보면 아래와 같습니다.

#### 순차적으로 추가/삭제하는 경우에는 ArrayList 가 LinkedList 보다 빠르다.

만약 ArrayList 가 새로운 배열에 데이터를 복사하는 비용이 자주 발생하지 않는다면 LinkedList 보다 빠른것이 일반적입니다. 하지만, 반대로 복사비용이 자주 발생한다면 LinkedList 가 더 빠를 수 있습니다.

#### 중간 데이터를 추가/삭제하는 경우네는 LinkedList 가 ArrayList 보다 빠르다.

중간 요소를 추가 또는 삭제하는 경우, LinkedList 는 각 요소간의 연결만 변경해주면 끝이므로 처리속도가 매우 빠릅니다. 반면 ArrayList 는 각 요소들을 재배치하여 추가할 공간을 확보하거나 빈 공간을 채워야하기 때문에 처리속도가 늦습니다.

#### 조회는 ArrayList 가 더 빠르다.

배열은 각 요소들이 연속적으로 메모리상에 존재하므로, 간단한 계산만으로 원하는 요소의 주소를 얻어서 곧바로 데이터를 조회할 수 있습니다. 반면 LinkedList 는 불연속적으로 메모리사상에 서로 연결된 구조입니다. 떄문에 저장해야하는 데이터 개수가 많아질수록 데이터 조회 시간이 길이집니다.

### ArrayList vs LinkedList : 결론이 뭔데? 🤷‍♂️

| 컬렉션     | 읽기   | 추가/삭제 | 특징                                                       |
| :--------- | :----- | :-------- | :--------------------------------------------------------- |
| ArrayList  | 빠르다 | 느리다    | - 순차적인 추가삭제는 더 빠르다. / - 비효율적인 메모리사용 |
| LinkedList | 느리다 | 빠르다    | 데이터가 많을수록 접근성이 떨어진다.                       |

다루고자 하는 데이터의 개수가 잘 변하지 않는 경우라면, ArrayList 가 최고의 선택이 될겁니다. 반면 데이터 개수의 변동이 잦다면 LinkedList 를 사용하는것이 더 나은선택이 될 수도 있습니다.

#### LinkedList 메소드 기능명세

LinkedList 에서 제공하는 메소드의 기능들을 나열해보면서, List 에 대한 구현체 설명을 마무리짓겠습니다. 앞서 봤던 기능들과 겹치는것이 매우 많아서(ex. add(), indexOf(), retainAll() 등) , LinkedList 에서만 독특하게 제공하는 기능만을 명세했습니다.

| 기능                                  | 설명                                                       |
| :------------------------------------ | :--------------------------------------------------------- |
| element()                             | 첫번째 요소를 반환                                         |
| offer()                               | 지정된 객체를 끝에추가. 성공하면 true, 실패하면 false 반환 |
| peek()                                | 첫번째 요소를 반환                                         |
| pool()                                | 첫번째 요소를 반환하고 제거한다.                           |
| remove(), removeFirst(), removeLast() | (생략)                                                     |
| addFirst(), addLast()                 | (생략)                                                     |
| getFirst(), getLast()                 | (생략)                                                     |

---

## Set

다음으론 Set 에 대한 구현체 HashSet, TreeSet 입니다.

### HashSet, LinkedHashSet

HashSet 은 Set 인터페이스를 구현한 가장 대표적인 인터페이스이며, **중복된 요소를 저장하지 않습니다.** 요소 추가시 add(), addAll() 를 활용하는데, 이미 HashSet 에 저장되어 있는 동일한 요소가 존재한다면 false 를 반환합니다. List 구현체와 달리 저장순서를 유지하지 않으므로, **저장순서 유지를 원한다면 LinkedHashSet 을 활용하면 됩니다.**

#### 기능명세

기능 및 메소드들은 앞서 살펴봤던 모든 기능들을 제공합니다.

| 기능                                            | 설명   |
| :---------------------------------------------- | :----- |
| add(), addAll()                                 | (생략) |
| clear(), clone(), isEmpty(), iterator(), size() | (생략) |
| contains(), containsAll()                       | (생략) |
| remove(), removeAll()                           | (생략) |
| toArray()                                       | (생략) |

#### 예제

```java
Set<Sttring> setA = new HashSet();
setA.add("1"); setA.add("2");

Iterator it = setA.iterator();
while(it.hasNext()){
  Object tmp = it.next();
  if(setA.contains(tmp))
  	setB.add(tmp);
}
```

### TreeSet

TreeSet 은 이진검색트리의 성능을 향상시킨 Red-Black Tree 로 구현되어 있습니다. **중복된 데이터의 저장을 허용하지 않으며 정렬된 위치에 저장하므로, 저장순서도 유지하지 않습니다.**

#### 언제사용할까?

HashSet 에 비하면 자주 사용되지는 않는데, 일단 특징을 알아봅시다. 트리는 데이터를 순차적으로 저장하는 것이 아니라 저장위치를 찾아서 저장해야하고, 삭제하는 경우 트리의 일부를 재구성해야하므로 링크드리스트보다 **데이터의 추가/삭제 시간이 더 오래걸립니다.** 대신 배열이나 링크드리스트에 비해 **검색과 정렬기능이 더욱 뛰어납니다.**

---

## Map

### HashMap

HashTable 와 HashMap 관계는 Vector 와 ArrayList 의 관계와 같습니다. 따라서 **새로운 버전인 HashMap 을 사용합시다.** HashMap 은 key-value 를 묶어서 하나의 데이터(엔트리) 로 저장합니다. 또 `해싱(Hashing)` 을 사용하기 때문에 **대량의 데이터를 검색**하는데 있어 뛰어난 성능을 보입니다.

키(Key) 는 유니크(Unique) 한 특징(즉, 중복 허용안함) 을 지니며, 값(value) 는 중복을 허용합니다.

### Map.Entry

HashMap 이 데이터를 어떻게 저장하는지 확인하기 위해 실제소스의 일부를 발췌해봤습니다. 이렇게 HashMap 은 Entry 라는 내부클래스를 정의하고, 다시 Entry 타입의 배열을 선언하고 있습니다.

```java
public class HashMap extends AbstractMap implements Map, Cloneable, Serializable{
	transient Entry[] table;
    // ...
    static class Entry implements Map.Entry {
    	final Object key;
        Object value;
    }
}
```

#### Map.Entry 기능명세

Map.Entry 인터페이스의 메소드 기능은 아래와 같습니다.

| 기능       | 설명                                        |
| :--------- | :------------------------------------------ |
| equals()   | 동일한 Entry 인지 비교한다.                 |
| getKey()   | Entry 의 Key 객체를 반환한다.               |
| getValue() | Entry 의 Value 객체를 반환한다.             |
| hashCode() | Entry 의 헤시코드를 반환한다.               |
| setValue() | Entry 의 value 객체를 지정된 객체로 바꾼다. |

#### HashMap 기능명세

HashMap 의 기능 및 메소드들은 앞서 살펴봤던 모든 기능들을 제공합니다.

| 기능                                | 설명                                                                                     |
| :---------------------------------- | :--------------------------------------------------------------------------------------- |
| clear(), clone(), isEmpty(), size() | (생략)                                                                                   |
| containsKey(), containsValue()      | key (또는 value) 의 포함여부                                                             |
| entrySet()                          | HashMap 에 저장된 key, value 를 엔트리(key, value의 결합) 의 형태로 Set 에 저장해서 반환 |
| keySet()                            | HashMap 에 저장된 모든 key 가 저장된 Set 을 반환                                         |
| values()                            | HashMap 에 저장된 모든 값을 컬렉션의 형태로 반환                                         |
| get()                               | 지정된 key 에 대한 value 를 반환. 못찾으면 Null 반환                                     |
| put()                               | 지정된 Key 와 value 를 HashMap 에 저장                                                   |
| putAll()                            | 지정된 Map 에 저장된 모든 요소를 HashMap 에 저장                                         |
| replace()                           | 지정된 key, value 를 객체(value) 로 대체                                                 |

#### 예시코드

```java
void grammerTest3(){
        Map<String, Integer> map = new HashMap();
        map.put("김자바", 100);
        map.put("이자바", 100);
        map.put("강자바", 80);
        map.put("안자바", 90);

        Set set = map.entrySet();
        Iterator it = set.iterator();
        while (it.hasNext()){
            Map.Entry e = (Map.Entry) it.next();
            System.out.println("이름:" + e.getKey() + "점수:" + e.getValue());
        }
        set = map.keySet();
        System.out.println("참가자 명단:" + set);

        Collection values = map.values();
        it = values.iterator();
        int total = 0;
        while(it.hasNext()){
            Integer i = (Integer) it.next();
            total += i.intValue();
        }
    }
```

### TreeMap

추가적으로 TreeMap 에 대해서 간단히만 알아봅시다. 이름그대로 이진검색트리의 형태로, key-value 쌍으로 이루어진 엔트리를 저장합니다.

### HashMap vs TreeMap

HashMap 과 TreeMap 를 비교해보면, 조회 성능이 대부분의 경우에서 HashMap 이 TreeMap 보다 뛰어나므로, **대부분의 상황에선 HashMap 을 사용하는 것이 좋습니다.** 다만, 범위검색이나 정렬이 필요한 경우에는 TreeMap 을 사용합시다.

---

## 더 학습해볼 키워드

- Comparator, Comparable
- Iterator, ListIterator, Enumeration
- Arrays

---

## 참고

- 자바의 정석 (3rd Edition)
- ChatGPT
- https://fruitdev.tistory.com/141
