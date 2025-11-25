---
title: Gainsight Sync Microservice API v0.1.0
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="gainsight-sync-microservice-api">Gainsight Sync Microservice API v0.1.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

OpenAPI spec for the Gainsight Sync microservice (selected endpoints).

Base URLs:

* <a href="http://localhost:80">http://localhost:80</a>

<h1 id="gainsight-sync-microservice-api-default">Default</h1>

## get__activeUsers

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUsers \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUsers HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUsers',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUsers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUsers', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUsers', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUsers");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUsers", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUsers`

*Get active users*

<h3 id="get__activeusers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string(date-time)|false|none|
|end|query|string(date-time)|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "roles": [
      "string"
    ],
    "country": "string"
  }
]
```

<h3 id="get__activeusers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Array of users|[ActiveUserList](#schemaactiveuserlist)|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_numberOfUsers

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/numberOfUsers \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/numberOfUsers HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/numberOfUsers',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/numberOfUsers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/numberOfUsers', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/numberOfUsers', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/numberOfUsers");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/numberOfUsers", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/numberOfUsers`

*Number of active users*

<h3 id="get__activeusermetrics_numberofusers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string(date-time)|false|none|
|end|query|string(date-time)|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "count": 0
}
```

<h3 id="get__activeusermetrics_numberofusers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Count|[Count](#schemacount)|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_newSignups

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/newSignups \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/newSignups HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/newSignups',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/newSignups',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/newSignups', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/newSignups', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/newSignups");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/newSignups", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/newSignups`

*New signups*

<h3 id="get__activeusermetrics_newsignups-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string(date-time)|false|none|
|end|query|string(date-time)|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "count": 0
}
```

<h3 id="get__activeusermetrics_newsignups-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Count|[Count](#schemacount)|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topLanguages

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topLanguages \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topLanguages HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topLanguages',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topLanguages',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topLanguages', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topLanguages', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topLanguages");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topLanguages", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topLanguages`

*Top languages*

<h3 id="get__activeusermetrics_toplanguages-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_toplanguages-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Language counts|Inline|

<h3 id="get__activeusermetrics_toplanguages-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topUserRoles

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topUserRoles \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topUserRoles HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topUserRoles',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topUserRoles',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topUserRoles', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topUserRoles', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topUserRoles");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topUserRoles", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topUserRoles`

*Top user roles*

<h3 id="get__activeusermetrics_topuserroles-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_topuserroles-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Role counts|Inline|

<h3 id="get__activeusermetrics_topuserroles-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topCountries

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topCountries \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topCountries HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topCountries',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topCountries',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topCountries', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topCountries', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topCountries");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topCountries", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topCountries`

*Top countries*

<h3 id="get__activeusermetrics_topcountries-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_topcountries-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Country counts|Inline|

<h3 id="get__activeusermetrics_topcountries-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topPlatforms

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topPlatforms \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topPlatforms HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topPlatforms',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topPlatforms',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topPlatforms', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topPlatforms', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topPlatforms");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topPlatforms", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topPlatforms`

*Top platforms*

<h3 id="get__activeusermetrics_topplatforms-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_topplatforms-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Platform counts|Inline|

<h3 id="get__activeusermetrics_topplatforms-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topBrowsers

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topBrowsers \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topBrowsers HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topBrowsers',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topBrowsers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topBrowsers', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topBrowsers', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topBrowsers");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topBrowsers", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topBrowsers`

*Top browsers*

<h3 id="get__activeusermetrics_topbrowsers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_topbrowsers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Browser counts|Inline|

<h3 id="get__activeusermetrics_topbrowsers-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_topDeviceTypes

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/topDeviceTypes \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/topDeviceTypes HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/topDeviceTypes',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/topDeviceTypes',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/topDeviceTypes', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/topDeviceTypes', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/topDeviceTypes");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/topDeviceTypes", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/topDeviceTypes`

*Top device types*

<h3 id="get__activeusermetrics_topdevicetypes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_topdevicetypes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Device counts|Inline|

<h3 id="get__activeusermetrics_topdevicetypes-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__activeUserMetrics_mailDomainNames

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/activeUserMetrics/mailDomainNames \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/activeUserMetrics/mailDomainNames HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/activeUserMetrics/mailDomainNames',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/activeUserMetrics/mailDomainNames',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/activeUserMetrics/mailDomainNames', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/activeUserMetrics/mailDomainNames', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/activeUserMetrics/mailDomainNames");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/activeUserMetrics/mailDomainNames", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /activeUserMetrics/mailDomainNames`

*Mail domain counts*

<h3 id="get__activeusermetrics_maildomainnames-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0,
    "percentage": 0.1
  }
]
```

<h3 id="get__activeusermetrics_maildomainnames-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Mail domain counts|Inline|

<h3 id="get__activeusermetrics_maildomainnames-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[MetricItem](#schemametricitem)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|
|» percentage|number(float)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__customEvents

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/customEvents \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/customEvents HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/customEvents',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/customEvents',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/customEvents', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/customEvents', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/customEvents");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/customEvents", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /customEvents`

*Custom events*

<h3 id="get__customevents-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "date": "2019-08-24T14:15:22Z",
    "widgetName": "string",
    "sessionId": "string"
  }
]
```

<h3 id="get__customevents-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Custom events|Inline|

<h3 id="get__customevents-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[CustomEvent](#schemacustomevent)]|false|none|none|
|» date|string(date-time)|false|none|none|
|» widgetName|string|false|none|none|
|» sessionId|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__eventCounts

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/eventCounts \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/eventCounts HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/eventCounts',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/eventCounts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/eventCounts', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/eventCounts', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/eventCounts");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/eventCounts", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /eventCounts`

*Event counts by name*

<h3 id="get__eventcounts-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0
  }
]
```

<h3 id="get__eventcounts-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Counts|Inline|

<h3 id="get__eventcounts-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SimpleCount](#schemasimplecount)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__eventCountsByName

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/eventCountsByName?eventName=string \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/eventCountsByName?eventName=string HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/eventCountsByName?eventName=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/eventCountsByName',
  params: {
  'eventName' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/eventCountsByName', params={
  'eventName': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/eventCountsByName', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/eventCountsByName?eventName=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/eventCountsByName", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /eventCountsByName`

*Event counts grouped by widget name for an event*

<h3 id="get__eventcountsbyname-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|eventName|query|string|true|none|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0
  }
]
```

<h3 id="get__eventcountsbyname-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Widget counts|Inline|

<h3 id="get__eventcountsbyname-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SimpleCount](#schemasimplecount)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__sessionEvents

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/sessionEvents \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/sessionEvents HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/sessionEvents',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/sessionEvents',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/sessionEvents', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/sessionEvents', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/sessionEvents");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/sessionEvents", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /sessionEvents`

*Session events*

<h3 id="get__sessionevents-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "time": "2019-08-24T14:15:22Z",
    "eventId": "string",
    "identifyId": "string"
  }
]
```

<h3 id="get__sessionevents-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Session events|Inline|

<h3 id="get__sessionevents-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SessionEvent](#schemasessionevent)]|false|none|none|
|» time|string(date-time)|false|none|none|
|» eventId|string|false|none|none|
|» identifyId|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__sessionEventsAutoAgg

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/sessionEventsAutoAgg?start=string \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/sessionEventsAutoAgg?start=string HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/sessionEventsAutoAgg?start=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/sessionEventsAutoAgg',
  params: {
  'start' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/sessionEventsAutoAgg', params={
  'start': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/sessionEventsAutoAgg', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/sessionEventsAutoAgg?start=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/sessionEventsAutoAgg", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /sessionEventsAutoAgg`

*Auto-aggregated session events (minute/hour/day)*

<h3 id="get__sessioneventsautoagg-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|true|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "time": "2019-08-24T14:15:22Z",
    "count": 0
  }
]
```

<h3 id="get__sessioneventsautoagg-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Aggregated buckets|Inline|

<h3 id="get__sessioneventsautoagg-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[Bucket](#schemabucket)]|false|none|none|
|» time|string(date-time)|false|none|none|
|» count|integer|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__pageViews

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/pageViews \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/pageViews HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/pageViews',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/pageViews',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/pageViews', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/pageViews', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/pageViews");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/pageViews", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /pageViews`

*Page view events*

<h3 id="get__pageviews-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "scheme": "string",
    "host": "string",
    "path": "string",
    "hash": "string",
    "date": "2019-08-24T14:15:22Z"
  }
]
```

<h3 id="get__pageviews-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Page view events|Inline|

<h3 id="get__pageviews-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[PageView](#schemapageview)]|false|none|none|
|» scheme|string|false|none|none|
|» host|string|false|none|none|
|» path|string|false|none|none|
|» hash|string|false|none|none|
|» date|string(date-time)|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__popularDevices

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/popularDevices \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/popularDevices HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/popularDevices',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/popularDevices',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/popularDevices', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/popularDevices', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/popularDevices");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/popularDevices", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /popularDevices`

*Popular devices (from page view hashes/paths)*

<h3 id="get__populardevices-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0
  }
]
```

<h3 id="get__populardevices-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Popular devices|Inline|

<h3 id="get__populardevices-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SimpleCount](#schemasimplecount)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## get__pageViewCounts

> Code samples

```shell
# You can also use wget
curl -X GET http://localhost:80/pageViewCounts \
  -H 'Accept: application/json'

```

```http
GET http://localhost:80/pageViewCounts HTTP/1.1
Host: localhost:80
Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:80/pageViewCounts',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'http://localhost:80/pageViewCounts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('http://localhost:80/pageViewCounts', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','http://localhost:80/pageViewCounts', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("http://localhost:80/pageViewCounts");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "http://localhost:80/pageViewCounts", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /pageViewCounts`

*Counts grouped by page path*

<h3 id="get__pageviewcounts-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|start|query|string|false|none|
|end|query|string|false|none|
|tenantId|query|string|false|none|

> Example responses

> 200 Response

```json
[
  {
    "value": "string",
    "count": 0
  }
]
```

<h3 id="get__pageviewcounts-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Page view counts|Inline|

<h3 id="get__pageviewcounts-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SimpleCount](#schemasimplecount)]|false|none|none|
|» value|string|false|none|none|
|» count|integer|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_Count">Count</h2>
<!-- backwards compatibility -->
<a id="schemacount"></a>
<a id="schema_Count"></a>
<a id="tocScount"></a>
<a id="tocscount"></a>

```json
{
  "count": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|count|integer(int32)|false|none|none|

<h2 id="tocS_SimpleCount">SimpleCount</h2>
<!-- backwards compatibility -->
<a id="schemasimplecount"></a>
<a id="schema_SimpleCount"></a>
<a id="tocSsimplecount"></a>
<a id="tocssimplecount"></a>

```json
{
  "value": "string",
  "count": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|value|string|false|none|none|
|count|integer|false|none|none|

<h2 id="tocS_MetricItem">MetricItem</h2>
<!-- backwards compatibility -->
<a id="schemametricitem"></a>
<a id="schema_MetricItem"></a>
<a id="tocSmetricitem"></a>
<a id="tocsmetricitem"></a>

```json
{
  "value": "string",
  "count": 0,
  "percentage": 0.1
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|value|string|false|none|none|
|count|integer|false|none|none|
|percentage|number(float)|false|none|none|

<h2 id="tocS_ActiveUser">ActiveUser</h2>
<!-- backwards compatibility -->
<a id="schemaactiveuser"></a>
<a id="schema_ActiveUser"></a>
<a id="tocSactiveuser"></a>
<a id="tocsactiveuser"></a>

```json
{
  "id": "string",
  "roles": [
    "string"
  ],
  "country": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|none|
|roles|[string]|false|none|none|
|country|string|false|none|none|

<h2 id="tocS_ActiveUserList">ActiveUserList</h2>
<!-- backwards compatibility -->
<a id="schemaactiveuserlist"></a>
<a id="schema_ActiveUserList"></a>
<a id="tocSactiveuserlist"></a>
<a id="tocsactiveuserlist"></a>

```json
[
  {
    "id": "string",
    "roles": [
      "string"
    ],
    "country": "string"
  }
]

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[ActiveUser](#schemaactiveuser)]|false|none|none|

<h2 id="tocS_CustomEvent">CustomEvent</h2>
<!-- backwards compatibility -->
<a id="schemacustomevent"></a>
<a id="schema_CustomEvent"></a>
<a id="tocScustomevent"></a>
<a id="tocscustomevent"></a>

```json
{
  "date": "2019-08-24T14:15:22Z",
  "widgetName": "string",
  "sessionId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|date|string(date-time)|false|none|none|
|widgetName|string|false|none|none|
|sessionId|string|false|none|none|

<h2 id="tocS_SessionEvent">SessionEvent</h2>
<!-- backwards compatibility -->
<a id="schemasessionevent"></a>
<a id="schema_SessionEvent"></a>
<a id="tocSsessionevent"></a>
<a id="tocssessionevent"></a>

```json
{
  "time": "2019-08-24T14:15:22Z",
  "eventId": "string",
  "identifyId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|time|string(date-time)|false|none|none|
|eventId|string|false|none|none|
|identifyId|string|false|none|none|

<h2 id="tocS_Bucket">Bucket</h2>
<!-- backwards compatibility -->
<a id="schemabucket"></a>
<a id="schema_Bucket"></a>
<a id="tocSbucket"></a>
<a id="tocsbucket"></a>

```json
{
  "time": "2019-08-24T14:15:22Z",
  "count": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|time|string(date-time)|false|none|none|
|count|integer|false|none|none|

<h2 id="tocS_PageView">PageView</h2>
<!-- backwards compatibility -->
<a id="schemapageview"></a>
<a id="schema_PageView"></a>
<a id="tocSpageview"></a>
<a id="tocspageview"></a>

```json
{
  "scheme": "string",
  "host": "string",
  "path": "string",
  "hash": "string",
  "date": "2019-08-24T14:15:22Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|scheme|string|false|none|none|
|host|string|false|none|none|
|path|string|false|none|none|
|hash|string|false|none|none|
|date|string(date-time)|false|none|none|

