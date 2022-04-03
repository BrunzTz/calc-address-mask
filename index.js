const express = require('express')
const app = express();

const ejs = require('ejs');
const bodyParser = require('body-parser');
const Netmask = require('netmask').Netmask;

const port = 3000;
let netmask;

app.set('view engine', 'ejs');

const urlencondeParser = bodyParser.urlencoded({ extended: false })

app.get('/', (req, res) => {

    ejs.renderFile('./views/template.ejs', { netmask }, (err, data) => {
        if(err){
            return res.send('Erro na leitura do arquivo')
        }
        
        return res.send(data)
    })
})

app.post('/calculate', urlencondeParser, (req, res) => {
    console.log(req.body)
    dados = req.body

    const ipComplete = dados.ip + '/' + dados.mask

    netmask = new Netmask(ipComplete)

    netmask.ip = dados.ip

    const arrayIp = dados.ip.split(".")
    
    const ipFormated = arrayIp.map(ip => {
        return addZero(ip);
    }).join(".")

    
    const ipFormatedNumber = +ipFormated.replaceAll(".", "");
    
    netmask.class = verifyClass(ipFormatedNumber);
    netmask.type = verifyReservedAddress(ipFormatedNumber);

    res.redirect('/');
})

app.listen(port, error => {
    if(error) {
        console.log(error);
    } else {
        console.log('[server] started')
        console.log(`[port] ${port}`)
    }

})

const addZero = (num) => {
    if(num.length >= 3) return num
    else if(num.length === 1) return '00'+num
    else if(num.length === 2) return '0'+num
}

const verifyClass = (ip) => {
    if(ip <= 127255255255) return 'A'
    else if(ip >= 128000000000 && ip <= 191255255255) return 'B'
    else if(ip >= 192000000000 && ip <= 223255255255) return 'C'
    else if(ip >= 224000000000 && ip <= 239255255255) return 'D'
    else if(ip >= 240000000000 && ip <= 255255255255) return 'E'
    else return 'Não Identificado'
}

const verifyReservedAddress = (ip) => {
    if(ip >= 10000000000 && 10255255255) return 'Privado'
    else if(ip >= 172016000000 && ip <= 172031255255) return 'Privado'
    else if(ip >= 192168000000 && ip <= 192168255255) return 'Privado'
    else return 'Público'
}