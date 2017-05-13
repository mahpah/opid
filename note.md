## ToC
1. Tính cấp thiết của đề tài (Tại sao bọn Mẽo cứ nghĩ ra mấy cái linh tinh để chúng ta phải học)
2. OpenID and OAuth? Is it the same thing?
3. OpenID Connect Protocol

	3.1. Một số thuật ngữ

	3.2. Các bước cơ bản của giao thức

4. OpenId Connect Authorization Flow

	4.1. Code flow

	4.2. Implicit flow, or Password Flow

	4.3. Hybrid flow

5. Phụ lục

	5.1. Resource Owner password flow / grant type

	5.2. Tranh cãi của tác giả

## 1. Tính cấp thiết của đề tài (Tại sao bọn Mẽo cứ nghĩ ra mấy cái linh tinh để chúng ta phải học)

Đối với một ứng dụng trực tuyến, thì việc xác thực danh tính người dùng là điều cần thiết. Có rất ít ứng dụng trên đời mà mọi thông tin đều public. Luồng làm việc thông thường là:
- Người dùng truy cập ứng dụng
- Xem rất nhiều quảng cáo và các thông tin vô bổ
- Phát hiện ra là nếu đăng nhập sẽ không còn phải xem quảng cáo, ngoài ra còn đăng được quảng cáo của mình
- Án nút đăng ký, tạo tài khoản của mình. Máy chủ ứng dụng (Application Server) lưu lại thông tin đăng ký (Identifier)
- Ân nút đăng nhập, điền tên, mật khẩu đã tạo
- Application Server tìm kiếm và so khớp thông tin (validation)
- Cho phép truy cập
- Người dùng tiếp tục xem quảng cáo

Tất cả các công việc, từ lưu thông tin định danh người dùng, đến xác thực các thông tin này khi người dùng đăng nhập, đều được AS tự mình thực hiện. Thao tác này cũng rất nhanh và không tiêu thụ tài nguyên gì quá ghê gớm, tiếp tục như vậy cho đén ngày tận thế cũng không sao. Đến đây bạn có thể đóng tab này và đi ngủ.

Tuy nhiên, giả sử rằng doanh nghiệp của bạn ăn nên làm ra, tất nhiên lúc ấy bạn sẽ phát triển thêm nhiều dịch vụ giúp người dùng tiếp tục xem quảng cáo. Khi ấy nếu một ai đó đã từng sử dụng dịch vụ trước đó của bạn phải đăng ký tài khoản mới để dùng dịch vụ khác, chắc hẳn chị ấy sẽ không vui. Điều này lại thường xuyên xảy ra vì doanh nghiệp của bạn rất lớn cung cấp vô số dịch vụ đến hàng triệu người dùng. Với phương châm *Tất cả vì khách hàng thân yêu* bạn quyết tâm thay đổi điều này. Giải pháp cực kỳ đơn giản được tóm gọn trong 1 câu: *Tách riêng hệ thống đăng ký và xác thực ra thành một dịch vụ riêng (Identity Service) và các dịch vụ khác dùng chung định danh từ hệ thống mới này*. Tuyệt, để thực hiện điều này, chúng ta đã có hẳn 2 giao thức là OenId và open OAuth.

Hmm, làm gì phức tạp thế. Chỉ cần mỗi dịch vụ lưu username password để lấy profile từ Identity Service là được thôi mà.

Tất nhiên cũng được nhưng:
- Application Service vẫn phải lưu username/password và tệ hơn, lưu plaintext password. Identity Server phải sử dụng cơ chế nhận username password mỗi lần App Server yêu cầu xem profile
- Khi một App Service bị tấn công thì coi như người dùng đã cởi truồng
- Người dùng đổi pass thì lại đi đăng nhập lại toàn bộ dịch vụ.
- Không có cách nào ngừng sử dụng một dịch vụ riêng biệt
- ...

OK, hiểu rồi, nhưng tại sao lại có đến 2 giao thức?

## 2. OpenID và OAuth có giống nhau?
Đây là một vấn đề lịch sử hết sức thú vị. Nói thế có nghĩa là nó được đẻ ra vì một số sai lầm của ai đó trong quá khứ. Hãy quay lại với hệ sinh thái sản phẩm cực kỳ phong phú của chúng ta đã được đề cập ở phần 1. Mỗi khách hàng của chúng ta, tạm gọi là anh L., sử dụng nhiều sản phẩm khác nhau, nhưng thường không phải là tất cả (nếu có một người như thế, thì rất quý). Điều đó nghĩa là anh ấy thường không có quyển truy cập vào toàn bộ tài nguyên. Theo những gì chúng ta đã bàn luận ở trên, anh này nên có một tài khoản trong hệ thống tài khoản dùng chung, đó là open id của anh ta. Bây giờ, với open id này, anh ta được các dịch vụ xác nhận là một người dùng trong hệ thống. Sau đó dịch vụ phải trao đổi với hệ thống tài khoản để biết anh chàng cấp phép cho dịch vụ truy cập các thông tin nào.

Hãy nghĩ về hệ thống passport, hay hộ chiếu. Một người có passport có thể đi ra nước ngoài mà vẫn được xác nhận danh tính. Nhưng khi đến một nơi nào đó, mẽo chẳng hạn, cô này phải trình visa (hay thị thực) mới được vào nước này, sau đó được làm việc gì thì còn phụ thuộc loại thị thực của nảng. Passport của nàng là open id, còn hệ thống passport được công nhận trên toàn thế giới là một nhà cung cấp open id rất bự. Visa là một mã cấp quyền cho phép nàng làm hoặc không làm việc gì, trong ngữ cảnh của chúng ta, nó được gọi là access token. Giống visa, access token cần được thường xuyên gia hạn.

Lấy ví dụ khác. Xét trường hợp của Diệu, một thanh niên mới lớn, cao to đẹp giai, thao lược gồm tài. Tất nhiên đến tuổi cập kê, Diệu cũng tìm cho mình một người bạn gái. Sau một quá trình tìm hiểu và qua bạn bè và zalo giới thiệu, Diệu biết đến Huyền, một cô gái trẻ trung xinh đẹp nhà ở cuối thôn. Mang hết can đảm, Diệu đến xin phép bố Huyền được đi đi lại lại, đi ra đi vào với Huyền. Tất nhiên lúc ấy bố cô gái chưa biết đến danh thơm của Diệu, ông này dắt anh chàng đến gặp trưởng thôn T. Ông này do đã được Diệu cẩn thận đến giới thiệu từ trước (ngoài cao to đẹp giai Diệu còn là một người rất cẩn thận), ông T nhanh chóng xác nhận Diệu với bố của Huyền, không quên ca ngợi anh chàng đến tận mây xanh. Ở đây ngoài vai trò của một cán bộ mẫn cán, sâu sát với quần chúng, ông trưởng thôn T còn là một OpenID provider hoàn hảo. Bố Huyền hết sức hài lòng. Nhưng rào cản chưa phải đã hết, để được gặp Huyền, Diệu cần được sự cho phép của cấp trên của bố Huyền, tức là mẹ Huyền. Nhờ sự ủng hộ của bố Huyền và sự thao lược của bản thân, Diệu có được sự đồng ý của mẹ Huyền không mấy khó khăn. Ở đây mẹ Huyền sử dụng OAuth protocol, sau khi xác nhận bố Huyền là 1 partner đã biết trước, kèm id của trưởng thôn đảm bảo, mẹ Huyền cấp cho Diệu sự cho phép, hay access token cho phép anh qua lại với con gái bà. Câu chuyện đến đây là hết, phần tiếp theo thường được phát tán dưới dạng phim ảnh.

Tóm lại:
- OpenID là giao thức xác thực/ định danh, authentication protocol, tức cho phép xác định một tác nhân **LÀ AI**. Hệ thống cung cấp openID là Open ID provider, thường cần được tin tưởng bởi nhiều hệ thống khác, như FB, GG, Twitter...
- OAuth là giao thức ủy quyển, authorization protocol, giúp xác định một tác nhân được **LÀM GÌ**. Ví dụ ứng dụng của chúng ta được người dùng cấp cho quyển đọc thông tin email của họ trên resource server của FB. Chú ý rằng người ủy quyền không nhất thiết phải chứng minh bản thân mình là ai thông qua OpenID

## 3. OpenID Connect Protocol

Sử dụng 2 protocol là một điều phức tạp, ít nhất là đặc tả của chúng nó đều dài cả trăm trang, ai đọc hết được. Do đó OpenID foundation, đơn vị phát triển giao thức OpenId, đã nghĩ ra OpenID Connect, chuẩn định danh build dựa trên OAuth, tức là có cả chức năng định danh và ủy quyền, mục đích là --để cho tất cả những bọn đã implement cả 2 giao thức riêng biệt uất ức mà chết đi-- để xóa bỏ những khó khăn và sai lầm có thể xảy ra khi phải implement cả 2.

### 3.1. Một số thuật ngữ
* OpenID provider (OP): Hệ thống sử dụng OAuth protocol có chức năng xác định danh tính một người dùng
* Relying Party (RP): hay Client, là ứng dụng sử dụng danh tính được cung cấp bởi OpenID provider
* Entity: Một thực thể có thể được định danh, có thể là người dùng, tài nguyên, hệ thống...
* Claim: Khối thông tin về một thực thể nào đó
* Issuer: Thực thể phát hành một claim, như vậy OP là một issuer phát hành authentication claim
* End-User: người dùng tham gia vào quá trình xác thực. Đối với giao thức OAuth, đây gọi là Resource Owner, người này là người cấp quyền cho RP được làm thay một số vai trò của mình
* User-Agent: Phần mềm mà End-User sử dụng để tương tác với các server, hoặc là web browser, hoặc là native application
* Subject Identifier: Danh tính của người dùng được Issuer biết đến, duy nhất và không bao giờ gán lại, có thể coi là id của user trong OP.
* IDToken: token chứa claim về authentication event đang diễn ra. Một authentication event chứa cả danh tính người dùng lần thẩm quyền được ủy nhiệm. Điều đó có nghĩa là với cùng một danh tính nhưng việc yêu cầu các quyền khác nhau tạo ra các authentication event khác nhau.
* Scope: Các quyền được ủy thác cho RP
* Consent: hành động cho phép RP được quyền làm việc nào đó.

### 3.2. Các bước cơ bản của giao thức

- (0) Người dùng truy cập đên Relying Party và yêu cầu truy cập
- (1) RP gửi authentication request cho OP, mô tả scope sẽ được yêu cầu và response type muốn nhận được
- (2) OP yêu cầu End-User xác nhận danh tính, sau đó là consent cho phép RP các quyền trong scope
- (3) OP gửi trả lại RP authentication Response chứa claim theo respone type mong muốn ở (1), thường là ID Token và access token
- (4) (5) RP trao đổi access token lấy thông tin mong muốn

```
+--------+                                   +--------+
|        |                                   |        |
|        |---------(1) AuthN Request-------->|        |
|        |                                   |        |
|        |  +--------+                       |        |
|        |  |        |                       |        |
|        |  |  End-  |<--(2) AuthN & AuthZ-->|        |
|        |  |  User  |                       |        |
|   RP   |  |        |                       |   OP   |
|        |  +--------+                       |        |
|        |                                   |        |
|        |<--------(3) AuthN Response--------|        |
|        |                                   |        |
|        |---------(4) UserInfo Request----->|        |
|        |                                   |        |
|        |<--------(5) UserInfo Response-----|        |
|        |                                   |        |
+--------+                                   +--------+

nguồn: OpenID Connect Core 1.0 spec http://openid.net/specs/openid-connect-core-1_0.html
```

Một cách khái quát thì quá trình xác thực diễn ra theo sơ đồ trên, tuy nhiên chúng được cụ thể hóa thành 3 dạng flow, có độ phức tạp và bảo mật khác nhau [^n]

| Property                                        | Authorization Code Flow | Implicit Flow | Hybrid Flow |
| ----------------------------------------------- | :---------------------: | :-----------: | :---------: |
| All tokens returned from Authorization Endpoint | no                      | yes           | no          |
| All tokens returned from Token Endpoint         | yes                     | no            | no          |
| Tokens not revealed to User Agent               | yes                     | no            | no          |
| Client can be authenticated                     | yes                     | no            | yes         |
| Refresh Token possible                          | yes                     | no            | yes         |
| Communication in one round trip                 | no                      | yes           | no          |
| Most communication server-to-server             | yes                     | no            | varies      |

Việc RP muốn sử dụng flow nào được xác định thông qua respone type RP gửi cho OP ở bước 1. Cụ thể:

| response_type | Flow |
| --- | --- |
| code | Authorization Code Flow |
| id_token | Implicit Flow |
| id_token token | Implicit Flow |
| code id_token | Hybrid Flow |
| code token | Hybrid Flow |
| code id_token token | Hybrid Flow |

## 4. OpenId Connect Authorization Flow
### 4.1. Code flow
Flow này bảo mật nhất, token chỉ do các server RP và OP nắm giữ, User-Agent không được biết, tuy nhiên phức tạp hơn vì phải gửi đi gửi lại request 2 lần. Các bước thực hiện như sau:

1. End-User yêu cầu đăng nhập tại RP
2. RP redirect End-User đến Authentication endpoint của OP, gắn kèm các thông tin:
	- clientId: mã định danh của RP đã đăng ký với OP
	- scope: quyền mà RP muốn được cấp
	- respone_type: ở đây là code
	- redirect_uri: nếu xác thực người dùng thành công, OP sẽ redirect End-User đến đây, sau đó RP sẽ xử lý tiếp
	- nonce: no-more-than-once, một mã duy nhất cho 1 request, dùng để chống replay attack [^n]
	- prompt (Optional): nếu người dùng không đăng nhập sẵn trên OP, OP sẽ làm gì
	- một số thông tin khác...
3. OP render trang đăng nhập, hoặc chọn tài khoản, hoặc yêu cầu người dùng cấp quyền, hoặc chỉ đơn giản kiểm tra rằng End-User đã cấp quyền này trước đó hay chưa. Nếu thành công, redirect người dùng đển redirect uri đã nhận ở bước 2, gắn kèm vào đó là authorization code (mã định danh) để RP tiếp tục gửi token request. Đây là lý do tại sao response type ở bước 2 lại là code.
4. Người dùng đã được redirect đến redirect uri tại RP, lúc này RP nhận được authorization code và dùng code này gửi một token request đến OP. Request này gửi các dữ liệu
	- code
	- grant_type: đây là một khái niệm của OAuth, chỉ định dạng thể hiện của credential. Ở đây sử dụng `authorization_code`, chỉ ra rằng authorization code được cấp ở bước 3 được dùng để trao đổi lấy token. Grant type này chính là điểm phân biệt sự khác nhau giữa các flow.

	Nếu request thành công, OP sẽ trả về cho RP ID token, có thể kèm cả access token. Lúc này RP tùy ý xử lý, có thê render trang welcome user hoặc redirect đến đâu đó. Id token gồm các thông tin

	| Field | Meaning |
	| --- | --- |
	| iss | issuer phát hành token |
	| sub | subject, id của End-User trên OP |
	| aud | mã định danh của RP trên OP, thường gọi là client Id |
	| exp | expiration time, *thời điểm* hết hạn, unix timestamp |
	| iat | thời điểm phát hành, unix timestamp |
	| ... | một số thông tin khác, có tác dụng gây đau đầu |

5. RP tiến hành việc xác thực id token nhận được, có thể sử dụng client secret đã có trước đó cùng thuật toán đã xác đinh, giải mã token và so khớp các thông tin. Nếu thành công, từ điểm này trở đi RP đã có id token của người dùng và có thể sử dụng để lấy dữ liệu từ resource server

Như vậy có thể thấy Authorization Code flow sử dụng 2 round trip. Ở bước 3 redirect người dùng đến trang đăng nhập của OP để xác định danh tính người dùng. Ở bước 4 redirect người dùng trở lại RP để xác nhận đúng là RP có yêu cầu ủy quyền này.

### 4.2. Implicit flow, or Password Flow
Flow này bước 1 và 2 giống authorization code flow, tuy nhiên response type được chỉ định như mô tả ở 3.2
Tại bước 3 cũng tương tự, tuy nhiên do response type yêu cầu là id_token (và token) nên RP sẽ trả lại id token và access token (nếu yêu cầu) cho user agent, không yêu cầu RP gửi token request để lấy token nữa. Ở flow này không yêu cầu client phải xác thực bản thân một cách tường minh như bước 4 của authorization flow, chính vì thế nó có tên là Implicit Flow.

### 4.3. Hybrid flow
Các bước của flow này hoàn toàn giống với authorization code flow, ngoại trừ response type gửi đi ở authentication request (bước 2) là `code` và `id_token` để lấy ID token và hoặc `token` để lấy access token, hoặc cả 3. Sau bước này, OP trả lại authorization code và id token hoặc access token hoặc cả 2 tùy yêu cầu. RP có thể tiếp tục dùng authorization code để gửi token request như bước 4

RP khi nhận được authentication response có ngay access token để sử dụng đồng thời vẫn có authorization code để trao đổi lấy refresh token để dùng dài lâu (chú ý rằng vòng đời của access token là khá ngắn, chỉ vài chục phút)

## 5. Phụ lục

### 5.1. Resource Owner password flow / grant type

Đây thực tế không phải một flow được chấp nhận bởi OpenID connect mà chỉ có ý nghĩa với OAuth. Ở đây, thay vì grant type là authorization code, RP sử dụng chính cặp username password của Resource Owner hay End-User để trao đổi lấy token. Như vậy có nghĩa là người dùng phải hiến dâng username, password của mình cho RP, chỉ có thể sử dụng khi RP và OP là người một nhà.

### 5.2. Tranh cãi của tác giả
Năm năm trước Eran Hammer, tác giả chính của OAuth đã rút khỏi dự án này, xóa tên khỏi đặc tả vì theo anh này, OAuth 2 đã trở nên quá phức tạp, khó tích hợp và kém bảo mật, làm khó người dùng, tất cả chỉ nhằm giúp các doanh nghiệp bán được giải pháp tích hợp [^n]. Anh này sau đó giới thiệu một chuẩn authorization mới tên là Oz. Thông tin bên lề anh này là tác giả của một NodeJS framework tên là hapi, một thời gian trước trang npm cũng sử dụng bằng framework này

---
[^n]: Nguồn: [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html)

[^n]: Replay attack: Dạng tấn công mà kẻ tấn công sử dụng lại gói tin nạn nhân đã truyền trước đó gửi cho server hòng lấy lại được response giống như lần gửi trước đó. Đây là lý do tại sao các mật khẩu sử dụng một lần OTP nên được dùng phổ biến.

[^n]: https://hueniverse.com/oauth-2-0-and-the-road-to-hell-8eec45921529. Tôi đã bookmark bài viết này 3 năm mà chưa đọc
