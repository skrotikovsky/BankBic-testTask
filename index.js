const request = require("request");
const path = require("path")
const fs = require("fs")
const iconv = require("iconv-lite")
const AdmZip = require("adm-zip")



function getBic(x){
    if (/BIC="[0-9]{9}"/.exec(x)[0]){
        return /BIC="[0-9]{9}"/.exec(x)[0].substring(5, 14)
    }
    return []
}
function getNameP(x){
    if (/NameP=".*?="/.exec(x)){
        const a = /NameP=".*?="/.exec(x)
        a[0] = a[0].slice(0,-1).split('\"')
        a[0].pop()
        a[0] = a[0].join('')
        return a[0].substring(6, a[0].length)

    }
    return []
}
function getAccounts(x){
    const arr = x.split("Account=")
    arr.shift()
    const newArr = [];
    arr.forEach((x) => newArr.push(x.substring(1, 21)))
    return newArr
}

function parseBic() {
    request
        .get("http://www.cbr.ru/s/newbik")
        .on('error', function(err) {
            console.error(err)
        })
        .pipe(fs.createWriteStream("archive.zip"))
    const archPath= path.resolve(__dirname, "archive.zip")

    let zip = new AdmZip(archPath)
    let textXml = zip.getEntries()[0].getData().toString();
    textXml = iconv.decode(textXml, "Windows-1251")

    const textArr = textXml.split("</BICDirectoryEntry>");
    textArr.pop()
    const stringsArr = [];
    textArr.forEach((x) => {stringsArr.push([getBic(x), getNameP(x), getAccounts(x)])})
    const resultArr = []
    for (let bank of stringsArr) {
        for (let accounts of bank[2]){
            if (accounts === []) {
                continue
            }
            resultArr.push({bic: bank[0], name: bank[1], corrAccount: accounts})
        }
    }
    return resultArr
}

console.log(parseBic())
/*� �������� ��������� ������� ��� ������� ����� fetch � �� �����, � ��� �� ������ �� � ���� ������ ��������� ����
 ����� "�" �� ���� � ��� ��� ������� �������� ��� ��������� ��������, �� ����� � ���������� ��� ���������. ��� ��
 �������� �� �������, ��� ������� �� ������ �����, � ���� ����, ��� "NPM ������ � �������� �� �������� ��� �������������
" ��� ����� ������������� �� ����� ��� ������������� ��� ����������� �������, ��� ������� ����������� ���������
������� xml � �� (��� � ���-�� �������). � ������� � ����������� request �� ����� ������ �������� ��������
� �� ������ �����������. �������� ���!*/
