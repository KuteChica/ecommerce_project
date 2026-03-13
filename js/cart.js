const data=[
{
id:1,
name:"Furniture Set",
opt:"Coffee",
price:437,
qty:1,
img:"html/images/black.jpg"
},
{
id:2,
name:"Vintage Dining Set",
opt:"Brown",
price:945,
qty:2,
img:"html/images/black.jpg"
}
];

const items=document.getElementById("items");

function draw(){

items.innerHTML="";

data.forEach((it,idx)=>{

const row=document.createElement("div");
row.className="row";

row.innerHTML=`
<img src="${it.img}">
<div>
${it.name}<br>
<small>${it.opt}</small>
</div>

<div class="qty">
<button onclick="chg(${idx},-1)">-</button>
${it.qty}
<button onclick="chg(${idx},1)">+</button>
</div>

<div>
<button onclick="rem(${idx})">Remove</button>
</div>
`;

items.appendChild(row);

});

calc();

}

function calc(){

let subtotal=0;

data.forEach(i=>{
subtotal+=i.price*i.qty;
});

let discount=0;

const code=document.getElementById("code").value;

if(code==="SAVE10"){
discount=subtotal*0.1;
}

const total=subtotal-discount;

document.getElementById("sub").textContent="$"+subtotal.toFixed(2);
document.getElementById("disc").textContent="$"+discount.toFixed(2);
document.getElementById("total").textContent="$"+total.toFixed(2);

}

function chg(i,d){
data[i].qty=Math.max(1,data[i].qty+d);
draw();
}

function rem(i){
data.splice(i,1);
draw();
}

draw();