// http://jsfiddle.net/g6m5t8co/1/
window.draggable = function(){
  return {
     move: function(divid,xpos,ypos){
         divid.style.left = xpos + 'px';
         divid.style.top = ypos + 'px';
     },
     start: function(divid,container,evt){
         evt = evt || window.event;
         var posX = evt.clientX,
             posY = evt.clientY,
         divTop = divid.offsetTop,
         divLeft = divid.offsetLeft,
         eWi = parseInt(divid.style.width),
         eHe = parseInt(divid.style.height),
         cWi = parseInt(document.getElementById(container).style.width),
         cHe = parseInt(document.getElementById(container).style.height);
         document.getElementById(container).style.cursor='move';
         var diffX = posX - divLeft,
             diffY = posY - divTop;
         document.onmousemove = function(evt){
             evt = evt || window.event;
             var posX = evt.clientX,
                 posY = evt.clientY,
                 aX = posX - diffX,
                 aY = posY - diffY;
                 if (aX < 0) aX = 0;
                 if (aY < 0) aY = 0;
                 if (aX + eWi > cWi) aX = cWi - eWi;
                 if (aY + eHe > cHe) aY = cHe -eHe;
             window.draggable.move(divid,aX,aY);
         }
     },
     stop: function(container){
         document.getElementById(container).style.cursor='default';
         document.onmousemove = function(){}
     },
  }
}();
