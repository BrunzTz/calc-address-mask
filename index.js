const express = require('express')
const app = express();

const ejs = require('ejs');
const bodyParser = require('body-parser');
const Netmask = require('netmask').Netmask;

const port = 3000;
let netmask = {
    ip: '',
    bitmask: '',
    class: '',
    type: '',
    base: '',
    mask: '',
    broadcast: '',
    first: '',
    last: ''
}

app.set('view engine', 'ejs');

const urlencondeParser = bodyParser.urlencoded({ extended: false })

app.get('/', (req, res) => {

    ejs.renderFile('./views/template.ejs', { netmask }, (err, data) => {
        if(err){
            console.log(err)
            return res.send('Erro na leitura do arquivo')
        }
        
        return res.send(data)
    })
})

app.post('/calculate', urlencondeParser, (req, res) => {
    dados = req.body

    netmask.ip = dados.ip
    netmask.bitmask = '/' + dados.mask
    netmask.mask = notacaoCIDR(dados.mask)
    netmask.base = verificarRede(dados.ip, netmask.mask)
    netmask.broadcast = verificarBroadcast(dados.ip, netmask.mask)

    const ipFormatedNumber = converterIpStringParaNumero(dados.ip)
    
    netmask.class = verifyClass(ipFormatedNumber);
    netmask.type = verifyReservedAddress(ipFormatedNumber);

    const ipRede = converterIpStringParaNumero(netmask.base)
    const ipBroadcast = converterIpStringParaNumero(netmask.broadcast)

    const calcEscalaIp = calculaIPEscala(ipRede, ipBroadcast)

    netmask.first = calcEscalaIp.first
    netmask.last = calcEscalaIp.last

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

const converterIpStringParaNumero = (ip) => {
    const arrayIp = ip.split(".")
    
    const ipFormated = arrayIp.map(ip => {
        return addZero(ip);
    }).join(".")

    return +ipFormated.replaceAll(".", "");
}

const converterIpNumeroParaIP = (ip) => {
    const ipArr = ip.toString().split('')

    return ipArr.reduce((prev, current, idx, arr) => {
        const divTo3 = (idx + 1) % 3
    
        if(!divTo3 && idx != 1 && idx != arr.length -1){
            return prev + current + '.' 
        }
    
        return prev + current
    },'');
}

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

const converterBinarioParaDecimal = (value) => {
    return parseInt(value, 2);
}

const converterDecimalParaBinario = (decimal) => {
    return (decimal >>> 0).toString(2);
}

const preencherOcteto = (value) => {
    return "00000000".slice(value.length) + value;
}

const formatarBinarioQuatroOctetos = (value) => {
    let octeto = value.slice(0, 8);
    octeto += "." + value.slice(8, 16);
    octeto += "." + value.slice(16, 24);
    octeto += "." + value.slice(24, 32);
    return octeto;
}

const converteBinarioParaDecimalQuatroNumeros = (value) => {
    value = value.split(".");
    let numeros = converterBinarioParaDecimal(value[0]);
    numeros += "." + converterBinarioParaDecimal(value[1]);
    numeros += "." + converterBinarioParaDecimal(value[2]);
    numeros += "." + converterBinarioParaDecimal(value[3]);
    return numeros;
}

const converterDecimalParaBinarioQuatroOctetos = (value) => {
    value = value.split(".");
    let octetos = preencherOcteto(converterDecimalParaBinario(value[0]));
    octetos += "." + preencherOcteto(converterDecimalParaBinario(value[1]));
    octetos += "." + preencherOcteto(converterDecimalParaBinario(value[2]));
    octetos += "." + preencherOcteto(converterDecimalParaBinario(value[3]));
    return octetos;
}

const negacaoBinariaQuatroOctetos = (value) => {
    let valueNegado = "";
    for (let i = 0; i < value.length; i++) {
      let valueBin = value.charAt(i);
      if (valueBin === ".") {
        valueNegado += valueBin;
      } else {
        valueNegado += negacaoBinaria(valueBin);
      }
    }
    return valueNegado;
}

const negacaoBinaria = (value) => {
    return value === "1" ? "0" : "1";
}

const notacaoCIDR = (value) => {
    let mascaraCIDR = "";
  
    for (let i = 0; i < 32; i++) {
      if (i < value) {
        mascaraCIDR += "1";
      } else {
        mascaraCIDR += "0";
      }
    }
  
    mascaraCIDR = converteBinarioParaDecimalQuatroNumeros(
      formatarBinarioQuatroOctetos(mascaraCIDR)
    );
    
    return mascaraCIDR;
}

const verificarRede = (ip, mascara) => {
    ip = converterDecimalParaBinarioQuatroOctetos(ip);
    mascara = converterDecimalParaBinarioQuatroOctetos(mascara);
  
    let rede = "";
  
    for (let i = 0; i < ip.length; i++) {
      let ipBin = ip.charAt(i);
      let mascaraBin = mascara.charAt(i);
  
      if (ipBin === "." || mascaraBin === ".") {
        rede += ipBin || mascaraBin;
      } else {
        rede += ipBin & mascaraBin;
      }
    }
  
    return converteBinarioParaDecimalQuatroNumeros(rede);
}

const verificarBroadcast = (ip, mascara) => {
    ip = converterDecimalParaBinarioQuatroOctetos(ip);
    mascara = negacaoBinariaQuatroOctetos(
      converterDecimalParaBinarioQuatroOctetos(mascara)
    );
  
    let broadcast = "";
  
    for (let i = 0; i < ip.length; i++) {
      let ipBin = ip.charAt(i);
      let mascaraBin = mascara.charAt(i);
  
      if (ipBin === "." || mascaraBin === ".") {
        broadcast += ".";
      } else {
        broadcast += ipBin | mascaraBin;
      }
    }
  
    return converteBinarioParaDecimalQuatroNumeros(broadcast);
} 

const calculaIPEscala = (base, broadcast) => {
    const calcPrimeiroIp = converterIpNumeroParaIP(base + 1)
    const calcUltimoIp = converterIpNumeroParaIP(broadcast - 1)

    return {
        first: calcPrimeiroIp,
        last: calcUltimoIp
    }
}