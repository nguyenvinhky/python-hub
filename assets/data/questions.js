/* ==========================================================================
   QUESTIONS DATA — 10 câu về danh sách & xâu ký tự
   Schema: { id, title, category, difficulty, body, explain,
            mode: "function"|"stdout"|"readonly",
            starterCode, expectedStdout, signature, tests, solution, visual }
   ========================================================================== */

window.QUESTIONS = [
  /* ------------------------------- CÂU 1 ------------------------------- */
  {
    id: 1,
    title: "Thao tác append / insert / remove",
    category: "list",
    difficulty: "Dễ",
    body: `Cho danh sách <code>hoc_sinh = ["An", "Bình", "Chi"]</code>. Hãy:
      <ol class="list-decimal pl-5 space-y-1 mt-2">
        <li>Thêm học sinh <code>"Dương"</code> vào <b>cuối</b> danh sách.</li>
        <li>Chèn học sinh <code>"Yến"</code> vào <b>vị trí thứ hai</b>.</li>
        <li>Xóa học sinh <code>"Bình"</code> bằng <b>2 cách</b> (chỉ số &amp; giá trị).</li>
      </ol>`,
    explain: `<ul>
      <li><code>append(x)</code> → luôn thêm vào <b>cuối</b> (O(1)).</li>
      <li><code>insert(i, x)</code> → chèn vào <b>chỉ số i</b>, phần tử từ i dịch phải.</li>
      <li>Xoá theo chỉ số: <code>del ds[i]</code> hoặc <code>ds.pop(i)</code>.</li>
      <li>Xoá theo giá trị: <code>ds.remove("Bình")</code> — chỉ xoá phần tử đầu tiên khớp.</li>
    </ul>`,
    mode: "stdout",
    starterCode: `hoc_sinh = ["An", "Bình", "Chi"]
print("Ban đầu:", hoc_sinh)

hoc_sinh.append("Dương")
print("Sau append:", hoc_sinh)

hoc_sinh.insert(1, "Yến")
print("Sau insert:", hoc_sinh)

del hoc_sinh[hoc_sinh.index("Bình")]
print("Sau del theo index:", hoc_sinh)

hoc_sinh.remove("Dương")
print("Sau remove theo giá trị:", hoc_sinh)`,
    expectedStdout: `Ban đầu: ['An', 'Bình', 'Chi']
Sau append: ['An', 'Bình', 'Chi', 'Dương']
Sau insert: ['An', 'Yến', 'Bình', 'Chi', 'Dương']
Sau del theo index: ['An', 'Yến', 'Chi', 'Dương']
Sau remove theo giá trị: ['An', 'Yến', 'Chi']`,
    visual: "listOps",
    solution: `### Lời giải chi tiết

**Bước 1 — append:** \`hoc_sinh.append("Dương")\` thêm "Dương" vào cuối. Danh sách trở thành \`['An', 'Bình', 'Chi', 'Dương']\`.

**Bước 2 — insert:** \`hoc_sinh.insert(1, "Yến")\` chèn "Yến" vào **chỉ số 1** (vị trí thứ hai). Các phần tử từ index 1 trở đi **dịch sang phải** 1 ô.

**Bước 3a — xoá theo chỉ số:** Tìm index của "Bình" bằng \`hoc_sinh.index("Bình")\`, rồi \`del hoc_sinh[idx]\` (hoặc \`pop(idx)\` nếu muốn lấy giá trị đã xoá).

**Bước 3b — xoá theo giá trị:** \`hoc_sinh.remove("x")\` tìm từ đầu và xoá **lần xuất hiện đầu tiên** của "x". Nếu "x" không có trong danh sách sẽ bị \`ValueError\`.`
  },

  /* ------------------------------- CÂU 2 ------------------------------- */
  {
    id: 2,
    title: "Tính tổng list bằng vòng for",
    category: "list",
    difficulty: "Dễ",
    body: `Viết hàm <code>tong(A)</code> nhận vào một danh sách số và <b>trả về</b> tổng các phần tử.
      <br><span class="text-sm text-slate-500 mt-2 block">⚙️ Yêu cầu kỹ thuật: dùng vòng <code>for</code> (có thể thêm bản dùng <code>sum()</code> để so sánh).</span>`,
    explain: `<ul>
      <li>Khởi tạo <code>tong = 0</code>.</li>
      <li>Duyệt <code>for x in A</code> và cộng dồn: <code>tong += x</code>.</li>
      <li>Cuối cùng <code>return tong</code>.</li>
    </ul>`,
    mode: "function",
    starterCode: `def tong(A):
    t = 0
    for x in A:
        t = t + x
    return t

# Thử nghiệm nhanh
print(tong([10, 20, 30, 40, 50]))`,
    signature: { name: "tong", params: ["A"] },
    tests: [
      { name: "Happy path — 5 số dương", input: [[10, 20, 30, 40, 50]], expected: 150 },
      { name: "Edge — 1 phần tử", input: [[7]], expected: 7 },
      { name: "Edge — list rỗng", input: [[]], expected: 0 },
      { name: "Có số âm", input: [[-5, 5, -3, 3, 10]], expected: 10 }
    ],
    visual: "sumList",
    solution: `### Lời giải

\`\`\`python
def tong(A):
    t = 0
    for x in A:
        t += x
    return t
\`\`\`

**Giải thích:**
- Biến \`t = 0\` là **phần tử trung tính** của phép cộng.
- Vòng \`for x in A\` lần lượt gán \`x\` bằng từng phần tử rồi cộng vào \`t\`.
- Với list rỗng, vòng for **không chạy lần nào** → trả về \`0\` (đúng test case edge).

**Cách viết ngắn bằng hàm có sẵn:**
\`\`\`python
def tong(A):
    return sum(A)
\`\`\``
  },

  /* ------------------------------- CÂU 3 ------------------------------- */
  {
    id: 3,
    title: "append() vs insert() — khi nào bắt buộc dùng insert()?",
    category: "list",
    difficulty: "Dễ",
    body: `Phân biệt <code>append()</code> và <code>insert()</code>. Trong trường hợp nào <b>bắt buộc</b> phải dùng <code>insert()</code>?`,
    explain: `<ul>
      <li><b>append(x)</b>: 1 tham số, thêm cuối, O(1) — rất nhanh.</li>
      <li><b>insert(i, x)</b>: 2 tham số, chèn vào vị trí <i>i</i>, O(n).</li>
      <li>Khi cần chèn vào <b>đầu</b> hoặc <b>giữa</b> → <code>append()</code> bất khả thi, phải dùng <code>insert()</code>.</li>
    </ul>`,
    mode: "readonly",
    starterCode: null,
    solution: `### So sánh append() và insert()

| Tiêu chí | \`append(x)\` | \`insert(i, x)\` |
|---|---|---|
| Số tham số | 1 | 2 |
| Vị trí thêm | Luôn cuối | Chỉ số \`i\` bất kỳ |
| Ảnh hưởng phần tử khác | Không | Phần tử từ \`i\` dịch phải |
| Độ phức tạp | O(1) rất nhanh | O(n) chậm hơn |

**Ví dụ:**
\`\`\`python
a = [1, 2, 3]
a.append(99)        # [1, 2, 3, 99]

b = [1, 2, 3]
b.insert(0, 99)     # [99, 1, 2, 3] — chèn đầu
b.insert(2, 77)     # [99, 1, 77, 2, 3] — chèn giữa
\`\`\`

**Bắt buộc dùng insert()** khi cần chèn vào **vị trí KHÔNG phải cuối** (đầu danh sách hoặc giữa) — \`append()\` không thể làm được điều này.`
  },

  /* ------------------------------- CÂU 4 ------------------------------- */
  {
    id: 4,
    title: "Lọc số chẵn từ danh sách",
    category: "list",
    difficulty: "Trung bình",
    body: `Viết hàm <code>loc_chan(ds)</code> nhận vào một danh sách số nguyên và <b>trả về</b> danh sách mới chỉ chứa các số chẵn.`,
    explain: `<ul>
      <li>Điều kiện số chẵn: <code>x % 2 == 0</code>.</li>
      <li>Cách 1: khởi tạo list rỗng, duyệt for + if + append.</li>
      <li>Cách 2: list comprehension <code>[x for x in ds if x%2==0]</code>.</li>
    </ul>`,
    mode: "function",
    starterCode: `def loc_chan(ds):
    kq = []
    for x in ds:
        if x % 2 == 0:
            kq.append(x)
    return kq

# Thử nghiệm
print(loc_chan([1, 2, 3, 4, 5, 6]))`,
    signature: { name: "loc_chan", params: ["ds"] },
    tests: [
      { name: "Happy path — 1..6", input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6] },
      { name: "Edge — list rỗng", input: [[]], expected: [] },
      { name: "Toàn số lẻ", input: [[1, 3, 5, 7]], expected: [] },
      { name: "Số âm và số 0", input: [[0, -2, -3, -4, 7]], expected: [0, -2, -4] }
    ],
    solution: `### Lời giải

\`\`\`python
def loc_chan(ds):
    return [x for x in ds if x % 2 == 0]
\`\`\`

**Giải thích:**
- \`x % 2 == 0\` → số chẵn (kể cả \`0\` và số âm chẵn như \`-4\`).
- **List comprehension** là cách Pythonic: đọc là "lấy mỗi x trong ds nếu x chia hết cho 2".
- Tương đương với:
  \`\`\`python
  kq = []
  for x in ds:
      if x % 2 == 0:
          kq.append(x)
  return kq
  \`\`\``
  },

  /* ------------------------------- CÂU 5 ------------------------------- */
  {
    id: 5,
    title: "Chỉ số dương & chỉ số âm",
    category: "list",
    difficulty: "Dễ",
    body: `Nếu danh sách có <code>n</code> phần tử, chỉ số dương và chỉ số âm của phần tử cuối cùng là bao nhiêu?`,
    explain: `<ul>
      <li>Python đánh chỉ số từ <b>0</b>.</li>
      <li>Chỉ số dương: <code>0 → n-1</code></li>
      <li>Chỉ số âm: <code>-1 → -n</code></li>
      <li>Phần tử cuối: chỉ số dương <code>n-1</code>, chỉ số âm <code>-1</code>.</li>
    </ul>`,
    mode: "readonly",
    starterCode: null,
    visual: "indexView",
    solution: `### Cơ chế chỉ số trong Python

Với danh sách \`a = ["An", "Bình", "Chi", "Dương", "Yến"]\` (n = 5):

| Phần tử | An | Bình | Chi | Dương | Yến |
|---|---|---|---|---|---|
| Chỉ số **dương** | 0 | 1 | 2 | 3 | **4** |
| Chỉ số **âm** | -5 | -4 | -3 | -2 | **-1** |

**Công thức tổng quát:**
- Chỉ số dương phần tử cuối = \`n - 1\`
- Chỉ số âm phần tử cuối = \`-1\`
- Chỉ số âm phần tử đầu = \`-n\`

**Ví dụ:**
\`\`\`python
a = ["An", "Bình", "Chi", "Dương", "Yến"]
print(a[0])    # An      — đầu, dương
print(a[-1])   # Yến     — cuối, âm
print(a[4])    # Yến     — cuối, dương (n-1 = 4)
print(a[-5])   # An      — đầu, âm (-n)
# a[5] hoặc a[-6] → IndexError
\`\`\``
  },

  /* ------------------------------- CÂU 6 ------------------------------- */
  {
    id: 6,
    title: "Immutable — xâu không thể thay đổi",
    category: "string",
    difficulty: "Trung bình",
    body: `Xâu trong Python có tính <b>immutable</b> (không thể thay đổi). Điều đó nghĩa là gì, và làm thế nào để "sửa" một ký tự trong xâu?`,
    explain: `<ul>
      <li><b>Immutable</b>: sau khi tạo, <b>không thể</b> thay đổi 1 ký tự trực tiếp. Mọi "sửa" đều tạo ra xâu <b>mới</b>.</li>
      <li>Thử <code>s[0] = "J"</code> → <code>TypeError</code>.</li>
      <li>3 cách "thay đổi": slicing + nối, <code>replace()</code>, hoặc chuyển sang list rồi <code>join()</code>.</li>
    </ul>`,
    mode: "readonly",
    starterCode: null,
    solution: `### Immutable là gì?

Một đối tượng **immutable** là đối tượng mà sau khi được tạo ra, **không thể thay đổi nội dung** bên trong. Các kiểu immutable trong Python: \`int\`, \`float\`, \`str\`, \`tuple\`, \`frozenset\`.

Khi bạn viết \`s[0] = "J"\`:
\`\`\`
TypeError: 'str' object does not support item assignment
\`\`\`

### 3 cách "thay đổi" một ký tự trong xâu

**Cách 1 — Slicing + nối:**
\`\`\`python
s = "Python"
s_moi = "J" + s[1:]       # 'Jython'
\`\`\`

**Cách 2 — replace():**
\`\`\`python
s_moi = s.replace("P", "J")  # 'Jython'
\`\`\`

**Cách 3 — Chuyển sang list rồi join():**
\`\`\`python
lst = list(s)
lst[0] = "J"
s_moi = "".join(lst)       # 'Jython'
\`\`\`

### Tại sao Python thiết kế xâu immutable?
- **Hiệu năng**: hashable → dùng làm key của dict, phần tử của set.
- **An toàn**: nhiều biến trỏ cùng một xâu mà không sợ bị thay đổi bất ngờ.
- **Tối ưu bộ nhớ**: Python có thể cache các xâu ngắn.`
  },

  /* ------------------------------- CÂU 7 ------------------------------- */
  {
    id: 7,
    title: "Slicing, len, find",
    category: "string",
    difficulty: "Trung bình",
    body: `Cho <code>s = "Học lập trình Python thật thú vị"</code>. Hãy in ra:
      <ol class="list-decimal pl-5 space-y-1 mt-2">
        <li>Xâu con <code>"lập trình"</code> bằng slicing.</li>
        <li>Độ dài xâu (bao gồm khoảng trắng).</li>
        <li>Vị trí xuất hiện của <code>"Python"</code> bằng <code>find()</code>.</li>
      </ol>`,
    explain: `<ul>
      <li><code>s[a:b]</code> lấy ký tự từ chỉ số <code>a</code> tới <code>b-1</code>.</li>
      <li><code>len(s)</code> đếm mọi ký tự (kể cả khoảng trắng).</li>
      <li><code>s.find(sub)</code> → vị trí xuất hiện đầu tiên, hoặc <code>-1</code>.</li>
    </ul>`,
    mode: "stdout",
    starterCode: `s = "Học lập trình Python thật thú vị"
print("Xâu con:", s[4:13])
print("Độ dài:", len(s))
print("Vị trí 'Python':", s.find("Python"))`,
    expectedStdout: `Xâu con: lập trình
Độ dài: 32
Vị trí 'Python': 14`,
    visual: "stringSlice",
    solution: `### Lời giải

\`\`\`python
s = "Học lập trình Python thật thú vị"

print("Xâu con:", s[4:13])         # lập trình
print("Độ dài:", len(s))            # 32
print("Vị trí 'Python':", s.find("Python"))   # 14
\`\`\`

**Giải thích vị trí slicing:**

| Ký tự | H | ọ | c | ␣ | l | ậ | p | ␣ | t | r | ì | n | h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

→ \`s[4:13]\` lấy ký tự từ index 4 đến 12 = "lập trình" (không lấy index 13).

**find() vs index()**:
- \`find()\` trả \`-1\` nếu không thấy.
- \`index()\` ném \`ValueError\` nếu không thấy.`
  },

  /* ------------------------------- CÂU 8 ------------------------------- */
  {
    id: 8,
    title: "Tách họ tên bằng split()",
    category: "string",
    difficulty: "Dễ",
    body: `Viết hàm <code>lay_ten(hoten)</code> nhận vào họ và tên (ví dụ <code>"Nguyễn Văn An"</code>) và <b>trả về</b> tên (từ cuối cùng trong xâu).`,
    explain: `<ul>
      <li><code>split()</code> (không tham số) tách theo khoảng trắng, trả về list các từ.</li>
      <li>Tên ở vị trí cuối → lấy bằng chỉ số âm <code>[-1]</code>, không phụ thuộc họ có bao nhiêu từ.</li>
    </ul>`,
    mode: "function",
    starterCode: `def lay_ten(hoten):
    ds = hoten.split()
    return ds[-1]

# Thử nghiệm
print(lay_ten("Nguyễn Văn An"))`,
    signature: { name: "lay_ten", params: ["hoten"] },
    tests: [
      { name: "3 từ", input: ["Nguyễn Văn An"], expected: "An" },
      { name: "3 từ khác", input: ["Trần Thị Hoa"], expected: "Hoa" },
      { name: "4 từ (họ kép)", input: ["Lê Hoàng Minh Phương"], expected: "Phương" },
      { name: "1 từ (chỉ tên)", input: ["An"], expected: "An" }
    ],
    solution: `### Lời giải

\`\`\`python
def lay_ten(hoten):
    return hoten.split()[-1]
\`\`\`

**Giải thích:**
- \`hoten.split()\` mặc định tách theo khoảng trắng (1 hay nhiều).
- \`[-1]\` lấy phần tử cuối cùng → chính là **tên** trong phong tục Việt Nam.
- Dù họ tên có 2, 3, 4 hay 5 từ, cú pháp này vẫn đúng vì ta dùng chỉ số âm đếm từ cuối.

**Các phương thức split() liên quan:**
- \`"a,b,c".split(",")\` → \`['a','b','c']\`
- \`"abc".split()\` (xâu 1 từ) → \`['abc']\` (vẫn là list 1 phần tử)`
  },

  /* ------------------------------- CÂU 9 ------------------------------- */
  {
    id: 9,
    title: "replace() và join() — ghép ngày tháng",
    category: "string",
    difficulty: "Trung bình",
    body: `Viết hàm <code>ghep_ngay(ds)</code> nhận một list 3 phần tử dạng <code>["dd", "mm", "yyyy"]</code> và <b>trả về</b> xâu ngày tháng dạng <code>"dd/mm/yyyy"</code>. Sử dụng <code>join()</code>.`,
    explain: `<ul>
      <li><code>"sep".join(list)</code> ghép các phần tử (phải là xâu) với <code>sep</code> ở giữa.</li>
      <li>Ngược của <code>join()</code> là <code>split()</code>.</li>
      <li><code>replace(old, new)</code> thay <b>tất cả</b> lần xuất hiện <code>old</code> bằng <code>new</code>.</li>
    </ul>`,
    mode: "function",
    starterCode: `def ghep_ngay(ds):
    return "/".join(ds)

# Thử nghiệm
print(ghep_ngay(["20", "04", "2026"]))`,
    signature: { name: "ghep_ngay", params: ["ds"] },
    tests: [
      { name: "Happy path", input: [["20", "04", "2026"]], expected: "20/04/2026" },
      { name: "Đầu năm", input: [["01", "01", "2000"]], expected: "01/01/2000" },
      { name: "Không có số 0 đệm", input: [["5", "10", "2026"]], expected: "5/10/2026" }
    ],
    solution: `### Lời giải

\`\`\`python
def ghep_ngay(ds):
    return "/".join(ds)
\`\`\`

**Cơ chế \`join()\`:**
- \`"/".join(["20", "04", "2026"])\` lần lượt ghép: \`"20"\` + \`"/"\` + \`"04"\` + \`"/"\` + \`"2026"\` = \`"20/04/2026"\`.
- Dấu phân cách chỉ xuất hiện **giữa** các phần tử, không ở đầu/cuối.

**Ví dụ khác với join():**
\`\`\`python
"-".join(["a", "b", "c"])     # 'a-b-c'
", ".join(["Python","Java"])  # 'Python, Java'
"".join(["H","i"])            # 'Hi'
\`\`\`

**replace() — ví dụ minh hoạ:**
\`\`\`python
s = "toi hoc python, toi yeu python"
s.replace("python", "Python")     # thay TẤT CẢ
s.replace("python", "Python", 1)  # thay 1 lần đầu
\`\`\`

**Lưu ý:** tất cả phần tử trong list phải là **str**, không phải int. Nếu có int phải ép kiểu trước:
\`\`\`python
"/".join([str(20), str(4), str(2026)])   # '20/4/2026'
\`\`\``
  },

  /* ------------------------------- CÂU 10 ------------------------------- */
  {
    id: 10,
    title: "Đếm chữ số & chuyển HOA",
    category: "string",
    difficulty: "Trung bình",
    body: `Cho một xâu ký tự (đã gán sẵn). Viết code để:
      <ol class="list-decimal pl-5 space-y-1 mt-2">
        <li>Đếm và in số lượng ký tự là chữ số trong xâu.</li>
        <li>Chuyển toàn bộ xâu sang chữ HOA và in kết quả.</li>
      </ol>`,
    explain: `<ul>
      <li><code>c.isdigit()</code> → True nếu <code>c</code> là '0'..'9'.</li>
      <li><code>s.upper()</code> chuyển chữ cái sang HOA, giữ nguyên ký tự khác.</li>
      <li>Phương thức liên quan: <code>lower()</code>, <code>title()</code>, <code>capitalize()</code>.</li>
    </ul>`,
    mode: "stdout",
    starterCode: `s = "Lop 10A1 co 35 HS nam 2026"

dem = 0
for c in s:
    if c.isdigit():
        dem += 1

print("Số chữ số:", dem)
print("Chữ HOA:", s.upper())`,
    expectedStdout: `Số chữ số: 9
Chữ HOA: LOP 10A1 CO 35 HS NAM 2026`,
    solution: `### Lời giải

\`\`\`python
s = "Lop 10A1 co 35 HS nam 2026"

dem = sum(1 for c in s if c.isdigit())
print("Số chữ số:", dem)          # 9
print("Chữ HOA:", s.upper())      # LOP 10A1 CO 35 HS NAM 2026
\`\`\`

**Giải thích:**
- \`c.isdigit()\` là phương thức của \`str\` trả về \`True\` nếu \`c\` thuộc \`'0'..'9'\`.
- Xâu \`"Lop 10A1 co 35 HS nam 2026"\` có **9 chữ số**: ba chữ \`1,0,1\` trong "10A1", hai chữ \`3,5\` trong "35", bốn chữ \`2,0,2,6\` trong "2026" → tổng = **3 + 2 + 4 = 9**.
- \`s.upper()\` trả về **xâu mới** (vì string immutable); ký tự không phải chữ cái được giữ nguyên.

**Các phương thức anh em:**
- \`s.lower()\` — chữ thường
- \`s.title()\` — viết hoa chữ cái đầu mỗi từ
- \`s.capitalize()\` — viết hoa chữ cái đầu xâu`
  }
];
