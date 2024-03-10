---
title: MySQL의 B+ Tree 구조 기반 인덱스 스캔 방식
date: "2023-06-14"
tags:
  - 데이터베이스
  - 인덱스
  - MySQL
---

[[MySQL 8.0] InnoDB 스토리지 엔진에서의 B+ Tree 인덱스를 통한 레코드 스캔 구조](https://velog.io/@msung99/MySQL-8.0-InnoDB-%EC%8A%A4%ED%86%A0%EB%A6%AC%EC%A7%80-%EC%97%94%EC%A7%84%EC%97%90%EC%84%9C%EC%9D%98-B-Tree-%EC%9D%B8%EB%8D%B1%EC%8A%A4%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%A0%88%EC%BD%94%EB%93%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%8A%A4%EC%BA%94-%EC%B5%9C%EC%A0%81%ED%99%94-%EA%B5%AC%EC%A1%B0) 에셔 다루었듯이, MySQL 8.0 버전부터 InnoDB 엔진에 기반하여 가동되며 인덱스는 B+ Tree 로 구현되어 있습니다.

이때 어떤 경우에 인덱스를 사용하게 유도할지, 또는 사용하지 못하게 할지 판단하려면 MySQL이 어떻게 인덱스를 활용해서 실제 레코드를 조회하는지 알아야합니다. 그에 대한 대표적인 스캔 방식으로 3가지가 존재합니다.

---

## 인덱스 레인지 스캔 (Index Range Scan)

인덱스 레인지 스캔이란 **검색해야 할 인덱스의 범위가 결정됐을 때 사용되는 방식**입니다. 인덱스 레인지 스캔방식은 다음 3가지 과정에 따라 수행됩니다.

> - 1.인덱스 탐색(Index Seek) : 인덱스에서 조건을 만족하는 값이 저장된 위치를 루트에서부터 리프까지 내려가며 탐색한다.

---

- 2.인덱스 스캔(Index Scan) : 앞서 탐색된 리프노드 위치에서부터 필요한만큼 인덱스를 차례대로 쭉 스캔한다.

---

- 3.레코드 조회 : 앞선 스캔 과정으로 읽어들인 리프노드의 key 값과 레코드 주솟값으로 레코드가 저장된 페이지를 가져오고, 최종 레코드를 읽어온다.

`B+ Tree` 의 인덱스 구조에 따라, 루트 노드에서부터 시작해서 브랜치 노드를 걸쳐서 원하는 특정 리프 노드까지 찾아 들어가서 레코드의 스캔 시작지점을 찾을 수 있게됩니다. 각 리프노드는 링크드리스트로 연결되어 있으므로, 만약 스캔을 하다 한 리프노드의 끝까지 스캔하면 다음 노드로 넘어가서 스캔을 계속 이어나갑니다.

### Random I/O 를 고려한 스캔 여부 결정

이때 리프 노드에서 쿼리문의 검색 조건에 일치하는 데이터를 찾으면 실제 데이터 파일에서 레코드를 일거오는 과정이 필요한데, 이때 레코드 한건 단위를 읽어올때마다 디스크 `랜덤 I/O` 가 발생하게 됩니다.

[[MySQL 8.0] 데이터베이스의 쿼리 성능 튜닝을 위한 랜덤 I/O 와 순차 I/O](https://velog.io/@msung99/MySQL-8.0-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4%EC%9D%98-%EC%BF%BC%EB%A6%AC-%EC%84%B1%EB%8A%A5-%ED%8A%9C%EB%8B%9D%EC%9D%84-%EC%9C%84%ED%95%9C-%EB%9E%9C%EB%8D%A4-IO-%EC%99%80-%EC%88%9C%EC%B0%A8-IO) 에서도 언급했듯이, 랜덤 I/O 는 비용이 꽤 많이 발생하는 작업입니다. 따라서 인덱스 레인지 스캔은 상황에 따라 활용여부를 결정해야 하는데, 이 기준은 읽어야할 레코드가 20~25% 를 넘으면 테이블의 데이터를 직접 읽는것이 더 효율적인 처리 방식이 됩니다.

### 실행계획(Execution Plan) 을 통해 확인해보기

실행 계획을 통해 실제로 인덱스 레인지 스캔일 발생하는지를 직접 확인해봅시다.
`실행 계획(Execution Plan)`이란 MySQL 의 `옵티마이저(Optimizer)` 가 쿼리를 최적화하여 처리할 계획을 나타낸 정보로, `EXPLAIN` 명령어를 통해 계획을 확인할 수 있습니다.

```sql
alter table User
add index user_em (email);
```

우선 위와같이 email 컬럼에 대해 user_em 이라는 인덱스를 생성했습니다.

```sql
explain
select password from User
where email between 'm' and 'z';
```

그러고 between 으로 email 컬럼에 대한 인덱스에 대해 레인지 스캔이 발생하도록 유도해봤습니다.

![](https://velog.velcdn.com/images/msung99/post/a406974e-68c7-42e1-9086-71f6bccfa290/image.png)

그 결과는 위와 같이 type 이 range 임을 확인하 수 있습니다. 즉, 실행계획을 직접보니, 위 쿼리는 정상적으로 레인지 스캔이 수행될 것임을 확인할 수 있습니다.

### 커버링 인덱스

SELECT, WHERE, ORDER BY 등과 같은 조회 쿼리문에 현재 인덱스로 활용되고있는 모든 컬럼이 담겨있는 경우가 있습니다. 즉, **쿼리를 실행시킬 수 있는 데이터를 인덱스가 모두 가지고 있는 인덱스**를 커버링 인덱스라고 합니다.

예를들어 아래와 같이 Member 테이블이 있을때, 프라이머리 키인 member_id 가 있고 email 이라는 컬럼이 모두 인덱스로 등록되었다고 할때, 이 두 컬럼은 커버링 인덱스가 되는것입니다.

```sql
select member_id, email
from Member;
```

**커버링 인덱스로 처리되는 인덱스는 디스크의 레코드는 랜덤 I/O 가 발생하지 않습니다.** 조회를 원하던 데이터들이 모두 인덱스에 담겨있기 떄문에, 굳이 디스크를 접근하지 않고도 조회가 가능하기 때문이죠. 이 떄문에 랜덤 I/O 가 상당히 줄어들고 성능이 그만큼 빨라집니다.

---

## 인덱스 풀 스캔 (Index Full Scan)

인덱스 레인지 스캔처럼 범위 탐색을 하지만, **인덱스 처음부터 끝까지 전부를 스캔하는 방식**을 인덱스 풀 스캔이라고 합니다. **쿼리의 조건절이 인덱스의 첫 컬럼이 아닌 경우**에 이 방식이 적용됩니다.

예를들어 인덱스를 (name, email, password) 로 설정해줬는데, 조건절은 email 또는 password 로 사용되는 경우입니다. 또는 `COUNT`, `ORDER BY` 와 같이 전체 테이블을 조회해야 하는 경우도 마찬가지로 인덱스 풀 스캔이 유리하기 때문에, 이 방식이 사용됩니다.

### 인덱스 풀 스캔의 발생조건

이 경우는 쿼리가 인덱스에 명시된 컬럼만으로 처리할 수 있는 `커버링 인덱스` 일때만 사용됩니다. 인덱스에 있는 컬럼만으로 처리할 수 없는 경우, 인덱스 풀 스캔이 사용되면 레코드마다 랜덤 I/O 가 발생해서 비효율적이기 떄문에 절대로 이 방식이 사용되지 않습니다. 즉, 커버링 인덱스가 아니라면 `테이블 풀 스캔` 을 수행합니다.

### 실행계획으로 직접 확인해보기 (1) : 인덱스 풀 스캔

정말로 풀 스캔이 걸리는지 직접 확인해봅시다. 우선 아래와 같이 3개의 컬럼을 포함하는 인덱스를 새롭게 생성해주었습니다.

```sql
ALTER TABLE User
ADD INDEX all_column_index (user_id, email, password);
```

그러고 첫번째 컬럼이 아닌 3번째 컬럼을 조건절에 넣고 조회문을 실행시켜봤습니다. 또한 select 로 추출하려는 컬럼은 커버링 인덱스에 해당됨을 짚고 넘어갑시다.

```sql
EXPLAIN
SELECT user_id from User
WHERE password = '12345678';
```

그 결과는 아래와 같이 type 에 `index` 가 걸린것을 볼 수 있습니다. 이때 index 란 인덱스 풀 스캔이 걸린것을 의미하니, 당황하지 맙시다. 이렇게 인덱스의 모든 범위를 탐색하게 된 것입니다.

![](https://velog.velcdn.com/images/msung99/post/4fa75899-fb48-4d9e-8353-7a90a1bc094c/image.png)

### 실행계획으로 직접 확인해보기 (2) : 풀 테이블 스캔(Full Table Scan)

앞선 방식은 select 로 추출하려는 컬럼이 인덱스에 포함된 커버링 인덱스입니다. 그런데, 만약 이 컬럼이 쿼리에서 인덱스를 구성하지 있지 않은 컬럼인 경우라면 어떻게 될까요? 아래처럼 인덱스에 포함되지 않은 gender 컬럼을 쿼리에 포함하여 실행계획을 살펴봅시다.

```sql
ALTER TABLE User
ADD INDEX ix_gender_birthdate(gender, birth_date, email);
```

우선 위처럼 인덱스를 새롭게 만들어주겠습니다.

```sql
EXPLAIN
SELECT password FROM User
WHERE birth_date = '1998-01-01';
```

그러고 커버링 인덱스에 해당되지 않는 password 컬럼을 조회해봅시다.

![](https://velog.velcdn.com/images/msung99/post/79f1d790-6723-4973-b84d-5f740fe0378d/image.png)

그런데 실행결과를 보면 type 이 index 가 아니라 `ALL` 임을 확인할 수 있습니다. ALL 은 `테이블 풀 스캔` 이 발생했음을 의미합니다. 즉, **커버링 인덱스가 아닌 경우는 옵티마이저가 인덱스 풀 스캔보다 테이블 풀 스캔이 효율적이라고 판단**하게 딥니다.

---

## 루스 인덱스 스캔 (Loose Index Scan)

말그래도 루스 인덱스는 느슨느슨하게 인덱스를 읽는것을 의미합니다. 이 방식은 **중간에 필요치 않은 인덱스 키 값은 무시(skip) 하고 다음으로 넘어가는 형태로 처리**합니다. 일반적으로 `GROUP BY` 또는 집합 함수 가운대 `MAX()` 또는 `MIN()` 함수에 대해 최적화를 하는 경우에 사용됩니다.

```sql
SELECT user_number, MIN(email)
FROM User
WHERE user_number between 1 and 3
GROUP BY user_number;
```

위의 User 테이블은 `(user_number, email)` 인덱스가 생성되었다고 해봅시다. `GROUP_BY` 를 통해 user_number 컬럼으로 그룹화를 할것이며, `MIN` 집계함수로 그룹별로 email 이 최솟값인 것을 가져올것입니다.

이때 인덱스는 `(user_number, email)` 조합으로 이미 자동정렬 된 상태이기 때문에, user_number 그룹별로 첫번째 레코드의 email 값만 읽어오면 됩니다. 즉, 옵티마이저는 인덱스에서 WHERE 조건을 만족하는 모든 범위 전체를 싹다 읽어올 필요가 없다는 것을 알고있기 때문에, 조건에 만족하지 않는 레코드는 그냥 무시하고 다음 레코드를 읽어옵니다.

위 상황에서는 user_number 로 그룹화된 user_number = 1,2,3 인 각 그룹에서 email 값으로 최솟값을 가지는 맨 앞의 레코드만 읽어오는 방식입니다.

### 실행계획으로 직접 확인하기

```sql
alter table User
add index user_id_email(user_number, email);
```

위와 같이 인덱스를 만들어줍시다.

```sql
EXPLAIN
SELECT user_number, MIN(email)
FROM User
WHERE user_number between 1 and 3
GROUP BY user_number;
```

그러고 위처럼 쿼리의 실행계획에 대한 실행결과를 보면, type 이 `range` 로 지정됩니다. 그런데 `Extra` 를 살펴보면 `Using index for group-by` 가 걸린것을 볼 수 있는데, 이는 루스 인덱스 스캔이 적용되었음을 의미합니다.

---

## 인덱스 스킵 스캔 (Index Skip Scan)

앞서 `인덱스 풀 스캔`에서 다루었기를, 인덱스의 첫번째 컬럼이 조건절에 해당하지 않으면 인덱스를 타지 않는다고 했었습니다.

```sql
ALTER TABLE User
ADD INDEX idx_gen_bir(gender, birth_date);
```

위와 같이 새로운 인덱스를 추가하고

```sql
(1) SELECT * FROM User WHERE gender='M' and birth_date='1999-01-01'
(2) SELECT * FROM User WHERE birth_date = '1999-01-01';
```

위와 같은 두 쿼리를 실행시켜본다고 해봅시다. 그렇다면 쿼리(1) 의 경우는 인덱스의 첫번째 컬럼 birth_date 를 WHERE 조건절에서 활용하고 있기 때문에 인덱스를 타게 될겁니다. 그런데, 쿼리(2) 는 조건절에 첫번째 컬럼이 존재하지 않기 때문에 인덱스를 타지 못하게 될것 가습니다. gender 로 시작하는 새로운 인덱스를 만들어서 실행해야 할것만 같죠.

그런데, 생각과 달리 MySQL 옵티마이저는 인덱스 스킵 스캔이라는 최적화 기능을 도입했습니다. 위 쿼리를 아래와 같이 두개의 쿼리로 최적화하여 실행해줍니다.

```sql
SELECT gender, FROM employee WHERE gender='M' AND birth_date > '1998-01-01';
SELECT gender, FROM employee WHERE gender='F' AND birth_date > '1998-01-01';
```

위와 같이 필요에따라 컬럼을 추가해주는 방식이 바로 인덱스 스킵 입니다. 그런데, 아직 MySQL 8.0 에 도입된지 얼마 안된 방식인지라 아래와 같은 단점이 존재합니다.

- **WHERE 조건절에 조건이 없는 인덱스의 선행 컬럼의 유니크한 값의 개수가 적어야함**
- **`커버링 인덱스` 이여야한다. 즉, 쿼리가 인덱스에 존재하는 컬럼만으로 처리가 가능해야 합니다.**

---

## 참고

- Real MySQL 8.0 (백은빈, 이성욱 지음)
- [[MySQL] B-Tree로 인덱스(Index)에 대해 쉽고 완벽하게 이해하기](https://mangkyu.tistory.com/286)
- [MySQL에서 커버링 인덱스로 쿼리 성능을 높여보자!!](https://gywn.net/2012/04/mysql-covering-index/)
- [인덱스 스캔 방식 종류 및 특징](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=gglee0127&logNo=221336088285)
- [데이터베이스 인덱스 (Index)](https://velog.io/@mu1616/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%9D%B8%EB%8D%B1%EC%8A%A4-Index)
