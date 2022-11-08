# pta-tb-experiment
An experiment to see if we can combine [Plain Text Accounting ("PTA")](https://plaintextaccounting.org/) with [TigerBeetle ("TB")](https://tigerbeetle.com/)

## Conclusions from the experiment

### 1. mapping account names

I used a dictionary to encode PTA accounts to TB accounts. For instance
`assets:bank:checking` becomes `BigInt("1" + "000" + "001" + "002")`. This works as long as accounts are not nested deeper than 12 levels (contain no more than 11 `:` characters) and as long as there are no more than 1000 different words used to compose them (the words in `dictionary.json`).
This could be optimized some more (the current code doesn't add unknown words to the dictionary).

### 2. Comments cannot be store
There is not enough room in UserData to store the comments from a PTA journal, including the quite essential comments in posting headers.
the UserData of a TB transfer is 16 bytes, so with Huffman Coding you could store probably about 40 characters in it. If need be you could add a second (zero-amount) transfer with the rest of the comment.

### 3. Refactor postings to two-account postings
In PTA, you can have [postings with more than two accounts](https://github.com/pondersource/pta-tb-experiment/blob/main/sample.journal#L43-L46). I refactor those to two postings with two accounts each. The algorithm assumes that there is always one "equalizer" account that doesn't have an explicit amount in the posting; in a more robust implementation you would have to use a slightly more sophisticated algorithm.

### 4. Lossless two-way conversion
I implemented a read-back check that reads back the data that was written, to check that the data comes back unchanged, but this does not include
things like currency, comments, full account names, etc. So you would always need to keep a separate regular database next to your TB cluster if you want to stream in / stream out PTA journals, and then the speed advantage is lost. To keep the speed advantage, I would probably opt for storing comments etc as-is in UserData and in additional zero-amount transfers if necessary. Another option would be to use TigerBeetle + Redis, that would still be pretty fast, but it does have the downside of putting a second database system into the critical path of your application. I opened https://github.com/tigerbeetledb/tigerbeetle/issues/241 about this.

### 5. Finding back the data you wrote into TB
I create transfers with consecutive id's starting from zero, so then you can just [read back all first n entries](https://github.com/pondersource/pta-tb-experiment/blob/main/index.mjs#L146-L148) or just [read back all entries in batches until you find a gap](https://github.com/pondersource/pta-tb-experiment/blob/e0179ee367cf0267e7295029c8be5c6a8410b2dc/test.mjs#L74-L86). I later switched so using the account name from 1. as the account id, to simplify transfer creation, and that means that there is no way to read them back, pending https://github.com/tigerbeetledb/tigerbeetle/issues/28.


## Run

```
# provision TigerBeetle's data directory
./format.sh
# run TigerBeetle
./start.sh
# import a Plain Text Accounting journal
node index.mjs ./sample.journal ./dictionary.json
```
