Ite.registerElement('ItePdfEditorElement','[role="pdf-editor"]',function(helper,htmlElement,parent){
	"use strict";
	var prv={};
	var pub=this;

	prv.helper=helper;
	prv.scope=(parent!=undefined?parent:pub);

	//extend	
	Ite.extend(pub,'IteElement',htmlElement,prv.scope);

	prv.metaData={};
	prv.pages=new IteArray();
	prv.ui;
	prv.editMode=true;

	prv.init=function(){
		prv.loadMetaData();
		prv.render();
	};

	prv.loadMetaData=function(){

		var imagePages=Ite.getAll('[role="pdf-editor-page"]');
		var pages=new IteArray();
		imagePages.each(function(){
			pages.push(this.getAttribute('data-image'));
		});

		var infoComponents=Ite.getAll('[role="pdf-editor-component"]');
		var components=new IteArray();
		infoComponents.each(function(item,index){
			components.push({
				'page':this.getAttribute('data-page')
				,'positionX':this.getAttribute('data-position-x')
				,'positionY':this.getAttribute('data-position-y')
				,'fontSize':this.getAttribute('data-font-size')
				,'maxLength':this.getAttribute('data-max-length')
				,'space':this.getAttribute('data-space')
				,'value':this.getAttribute('data-value')
				,'index':index
			});
		});

		prv.metaData['pages']=pages;
		prv.metaData['components']=components;
		Ite.try(function(){
			pub.getAttribute('data-preview-mode');
			prv.editMode=false;
		}).catch(AttributeNotFoundException,function(e){
			//ignore
		});

	};

	prv.render=function(){
		pub.addClass('pdf-editor');
		if(prv.editMode){
			pub.addClass('pdf-editor-edit-mode');
		}

		var template=`<FORM method="post">
				<DIV class="pdf-editor-workspace"></DIV>
				<BUTTON type="submit" class="pdf-editor-button" role="confirm">Confirm</BUTTON>
			<FORM>
		`;

		pub.setHtml(template);
		if(prv.editMode){
			pub.get('button').remove();
			prv.ui=new ItePdfEditorUI(pub);
		}

		prv.loadData();
	};

	prv.loadData=function(){
		var template='';
		prv.metaData['pages'].each(function(image,index){
			prv.pages.push(new ItePdfEditorPage(pub,image));
		});

		prv.metaData['components'].each(function(info,index){
			var component=new ItePdfEditorComponent(pub,info,prv.editMode);
			if(prv.editMode){
				prv.ui.add(component);
			}
		});

	};

	pub.getPage=function(page){
		return prv.pages.get(page-1);
	};

	pub.addEventSubmit=function(callback){
		pub.get('form').addEventSubmit(callback);
	};

	pub.getData=function(){
		return pub.get('form').getData();
	};

	prv.init();

});


function ItePdfEditorComponent(parent,config,editMode){
	"use strict";
	var prv={};
	var pub=this;

	prv.parent=parent;

	prv.page=1;
	prv.positionX=0;
	prv.positionY=0;
	prv.fontSize=10;
	prv.maxLength=null;
	prv.space=0;
	prv.exampleText='';
	prv.editMode=editMode;
	prv.value='';

	prv.element;
	prv.index;
	prv.callbackChange=new IteArray();
	prv.callbackFocus=new IteArray();
	prv.color;

	pub.addEventChange=function(callback){
		prv.callbackChange.push(callback);
	};

	pub.addEventFocus=function(callback){
		prv.callbackFocus.push(callback);
	};

	pub.setValue=function(value){
		prv.value=value;
	}

	pub.getPage=function(){
		return prv.page;
	};

	pub.getPositionX=function(){
		return prv.positionX;
	};

	pub.getPositionY=function(){
		return prv.positionY;
	};

	pub.getFontSize=function(){
		return prv.fontSize;
	};

	pub.getMaxLength=function(){
		return prv.maxLength;
	};

	pub.getSpace=function(){
		return prv.space;
	};

	pub.getExampleText=function(){
		return prv.exampleText;
	};

	pub.setPositionX=function(positionX){
		prv.positionX=positionX;
		pub.getElement().setPositionX(prv.positionX);
		prv.callbackChange.each(function(){
			this.call(null,'positionX',positionX);
		});
	};

	pub.setPositionY=function(positionY){
		prv.positionY=positionY;
		pub.getElement().setPositionY(prv.positionY);
		prv.callbackChange.each(function(){
			this.call(null,'positionY',positionY);
		});
	};

	pub.setPage=function(page){
		prv.page=page;
		prv.callbackChange.each(function(){
			this.call(null,'page',page);
		});
	};

	pub.setFontSize=function(fontSize){
		prv.fontSize=parseFloat(fontSize);
		pub.getElement().get('input').setFontSize(prv.fontSize);

		pub.getElement().get('div').setFontSize(prv.fontSize);

		prv.recalculateWidth();

		prv.callbackChange.each(function(){
			this.call(null,'fontSize',fontSize);
		});

		prv.recalculateWidth();
	};

	pub.setMaxLength=function(maxLength){
		prv.maxLength=parseInt(maxLength);
		prv.element.get('input').setAttribute('maxlength',prv.maxLength);
		var data=[];
		for(var i=0; i<prv.maxLength; i++){
			data.push('0');
		}
		prv.setExampleText(data.join(''));
		prv.recalculateWidth();
		prv.callbackChange.each(function(){
			this.call(null,'maxLength',prv.maxLength);
		});
	};

	pub.setSpace=function(space){
		prv.space=parseFloat(space);
		pub.getElement().get('input').setLetterSpacing(prv.space);
		pub.getElement().get('input').getDOMElement().style.padding='0 0 0 '+prv.space+'px';

		pub.getElement().get('div').setLetterSpacing(prv.space);
		pub.getElement().get('div').getDOMElement().style.padding='0 0 0 '+prv.space+'px';

		prv.recalculateWidth();

		prv.callbackChange.each(function(){
			this.call(null,'space',space);
		});
	};

	prv.setExampleText=function(exampleText){
		prv.exampleText=exampleText;
		var element=pub.getElement();
		element.get('div').setText(exampleText);
		if(prv.editMode){
			element.get('input').setValue(exampleText);
		}
		else{
			element.get('input').setValue(prv.value);			
		}

	};

	pub.getBackgroundColor=function(){
		return prv.color;
	};


	prv.recalculateWidth=function(){
		var element=pub.getElement().get('div');
		
		prv.element.get('input').setWidth(element.getWidth()+2);
	};

	pub.getData=function(){
		return {
			'page':pub.getPage()
			,'positionX':pub.getPositionX()
			,'positionY':pub.getPositionY()
			,'fontSize':pub.getFontSize()
			,'maxLength':pub.getMaxLength()
			,'exampleText':pub.getExampleText()
			,'space':pub.getSpace()
		};
	};

	pub.getElement=function(){
		return prv.element;
	};

	prv.init=function(){
		if(config){
			prv.index=config.index; //only preview mode
		}
		prv.element=Ite.createObject(prv.getTemplate());

		pub.setFontSize(12);
		pub.setMaxLength(1);
		if(config){
			pub.setValue(config.value);
			pub.setPage(config.page);
			pub.setPositionX(config.positionX);
			pub.setPositionY(config.positionY);
			pub.setMaxLength(config.maxLength);
			pub.setSpace(config.space);
			pub.setFontSize(config.fontSize);
		}

		prv.parent.getPage(pub.getPage()).addComponent(pub);
		prv.recalculateWidth();

		if(prv.editMode){
			prv.bind();
			prv.drawColor();
		}
		else{
			prv.element.get('input').setDisabled(false);
		}

	};

	prv.bind=function(){
		var isDown=false;
		var vectorX=0;
		var vectorY;
		var parentOffsetX=pub.getElement().getParent('.pdf-editor-page').getOffsetX();
		var offsetY=prv.element.getOffsetY();
		var offsetX=prv.element.getOffsetX();
		var mouseX=0;
		var mouseY=0;
		pub.getElement().addEventMouseDown(function(e){
			var button=e.getOrigin().button;
			if(button!=0){
				return;
			}

			isDown=true;
			offsetX=mouseX-prv.element.getOffsetX()+prv.element.getOffsetX()-prv.element.getPositionX();
			offsetY=mouseY-prv.element.getOffsetY()+prv.element.getOffsetY()-prv.element.getPositionY();
		});
		Ite.addEventMouseUp(function(e){
			isDown=false;
		});

		Ite.addEventMouseMove(function(e){
			mouseX = e.getOrigin().clientX + document.body.scrollLeft;
			mouseY = e.getOrigin().clientY + document.body.scrollTop;
			if(!isDown){
				return;
			}

			pub.setPositionX(mouseX-offsetX);
			pub.setPositionY(mouseY-offsetY);

		});

		//focus
		pub.getElement().addEventRightClick(function(){
			prv.callbackFocus.each(function(){
				this.call(null);
			});
		});

	};

	prv.drawColor=function(){
		prv.color=[prv.drawOct(),prv.drawOct(),prv.drawOct()];
		prv.element.get('input').setBackgroundColor(prv.color[0],prv.color[1],prv.color[2],0.5);
	};

	prv.drawOct=function(){
		return parseInt(Math.random()*255);
	};

	prv.getTemplate=function(){
		return `
			<div class="pdf-editor-component">
				<input class="pdf-editor-component" type="text" name='field[${prv.index}]' disabled /> 
				<div class="pdf-editor-component-width"></div>
			</div>
		`;

	};

	prv.init();

};

function ItePdfEditorPage(parent,image){
	"use strict";
	var prv={};
	var pub=this;

	prv.parent=parent;

	prv.image=image;
	prv.components={};
	prv.componentMaxIndex=0;
	prv.element;

	pub.getComponents=function(){
		var result=new IteArray();
		for(var component in prv.components){
			result.push(prv.components[component]);
		}

		return result;
	};

	pub.addComponent=function(component){
		prv.components[prv.componentMaxIndex++]=component;
		prv.element.get('.pdf-editor-page-content').append(component.getElement());
	};

	pub.removeComponent=function(component){
		component.getElement().remove();
		for(var index in prv.components){
			if(prv.components[index]!=component){
				continue;
			}

			delete prv.components[index];
			return;
		}

		throw new ObjectNotFoundException('');
	};

	prv.init=function(){

		var template=`
			<DIV class="pdf-editor-page">
				<SPAN class="pdf-editor-page-content">
					<IMG src=${prv.image} />
				</SPAN>
			</DIV>
		`;
		prv.element=Ite.createObject(template);
		prv.parent.get('.pdf-editor-workspace').append(prv.element);
	};

	pub.getElement=function(){
		return prv.element;
	};

	prv.init();

};

function ItePdfEditorUI(parent){
	"use strict";
	var prv={};
	var pub=this;


	prv.parent=parent;
	prv.element;
	prv.maxUIIndex=0;
	prv.focusComponent;

	pub.add=function(component){
		prv.focusComponent=component;
		new ItePdfEditorInterface(prv.element.get('.pdf-editor-info'),prv.maxUIIndex++,component,prv.callbackInterface());
	};

	prv.init=function(){
		prv.element=prv.render();
		prv.bind();
	};

	prv.render=function(){
		var template=`
			<DIV class="pdf-editor-ui">
				<FORM method="post">
					<BUTTON type="submit" class="pdf-editor-button" role="confirm">Confirm</BUTTON>
					<DIV class="pdf-editor-button" role="add">Add element</DIV>
					<DIV class="pdf-editor-info"></DIV>
				</FORM>
			</DIV>
		`;
		var element=Ite.createObject(template);
		prv.parent.append(element);
		return element;
	};

	prv.bind=function(){
		prv.element.get('[role="add"]').addEventClick(prv.callbackAdd());
		var validator=prv.element.get('form').getValidator();
		validator.setFieldListener(prv.callbackFieldValid());
		validator.setEnable(true);
		prv.element.get('form').addEventSubmit(function(e){
			if(this.isValid() && this.getData()['data']){
				e.setSystemHandle(true);
			}
		});
	};

	prv.callbackAdd=function(){
		return function(){
			var config=null;
			if(prv.focusComponent){
				config=prv.focusComponent.getData();
				config['positionX']=0;
				config['positionY']=0;
			}

			var component=new ItePdfEditorComponent(prv.parent,config,true);
			prv.parent.getPage(component.getPage()).addComponent(component);
			pub.add(component);
		}
	};

	prv.callbackFieldValid=function(){
		return function(field,correct){
			var form=field.getForm();
			if(correct){
				field.removeClass('pdf-editor-error');
			}
			else{
				field.addClass('pdf-editor-error');
			}

		};
	};

	prv.callbackInterface=function(){
		return {
			'remove':function(component){
				var currentPage=prv.parent.getPage(component.getPage());
				currentPage.removeComponent(component);
			}
			,'changePage':function(component,page){
				var currentPage=prv.parent.getPage(component.getPage());
				component.setPage(page);
				prv.parent.getPage(page).addComponent(component);
			}
		}

	};

	prv.init();
}

function ItePdfEditorInterface(container,index,component,callbacks){
	"use strict";
	var prv={};
	var pub=this;

	prv.component=component;
	prv.container=container;
	prv.index=index;
	prv.callbacks=callbacks;
	prv.element;

	prv.init=function(){
		prv.render();
		prv.component.addEventChange(prv.callbackChange());
		prv.component.addEventFocus(prv.callbackFocus());
	};

	prv.callbackRemove=function(container,component){
		return function(){
			if(prv.callbacks['remove']){
				prv.callbacks['remove'].call(null,prv.component);
			}

			prv.element.remove();
		};
	};

	prv.callbackFocus=function(){
		return function(field,value){
			prv.element.get('input').focus();
		};
	};

	prv.callbackUIComponent=function(component,methodName){
		return function(){
			component[methodName].call(null,this.getValue());
		};

	};

	prv.callbackPage=function(component){
		return function(){
			if(prv.callbacks['changePage']){
				prv.callbacks['changePage'].call(null,prv.component,this.getValue());
			}
		};
	};

	prv.callbackChange=function(){
		return function(field,value){
			prv.element.get('[role="'+field+'"]').setValue(value,false);
		};
	};

	prv.render=function(){
		var index=prv.index;
		var template=`
			<DIV>
				<TABLE>
					<TR><TH>Page</TH></TR>
					<TR><TD><INPUT type="number" role="page" required name="data[${index}][page]" min="1" /></TD></TR>
					<TR><TH>Position x</TH></TR>
					<TR><TD><INPUT type="number" role="positionX" required name="data[${index}][positionX]" min="0" /></TD></TR>
					<TR><TH>Position y</TH></TR>
					<TR><TD><INPUT type="number" role="positionY" required name="data[${index}][positionY]" min="0" /></TD></TR>
					<TR><TH>Font size</TH></TR>
					<TR><TD><INPUT type="number" role="fontSize" required name="data[${index}][fontSize]" min="1" /></TD></TR>
					<TR><TH>Max length</TH></TR>
					<TR><TD><INPUT type="number" role="maxLength" name="data[${index}][maxLength]" min="1" /></TD></TR>
					<TR><TH>Space</TH></TR>
					<TR><TD><INPUT type="number" role="space" name="data[${index}][space]" min="0" /></TD></TR>
					<TR><TD><DIV class="pdf-editor-button" role="remove">Remove</DIV></TD></TR>
				</TABLE>
			</DIV>
		`;
		prv.element=Ite.createObject(template);
		//set color
		var color=component.getBackgroundColor();
		prv.element.setBackgroundColor(color[0],color[1],color[2],0.5);

		container.append(prv.element,0);

		prv.element.get('[role="page"]').setValue(component.getPage());
		prv.element.get('[role="positionX"]').setValue(component.getPositionX(),false);
		prv.element.get('[role="positionY"]').setValue(component.getPositionY(),false);
		prv.element.get('[role="fontSize"]').setValue(component.getFontSize());
		prv.element.get('[role="maxLength"]').setValue(component.getMaxLength());
		prv.element.get('[role="space"]').setValue(component.getSpace());

		prv.element.get('[role="page"]').addEventChange(prv.callbackPage(component));
		prv.element.get('[role="positionX"]').addEventChange(prv.callbackUIComponent(component,'setPositionX'));
		prv.element.get('[role="positionY"]').addEventChange(prv.callbackUIComponent(component,'setPositionY'));
		prv.element.get('[role="fontSize"]').addEventChange(prv.callbackUIComponent(component,'setFontSize'))
		prv.element.get('[role="maxLength"]').addEventChange(prv.callbackUIComponent(component,'setMaxLength'))
		prv.element.get('[role="space"]').addEventChange(prv.callbackUIComponent(component,'setSpace'))

		var muteEnter=function(e){
			var event=e.getOrigin();
			if(event.keyCode==13){//enter
				this.fireEvent('change');
				e.setSystemHandle(false);
			}
		};

		container.getAll('input').each(function(){
			this.addEventKeyDown(muteEnter);

		});

		prv.element.get('[role="remove"]').addEventClick(prv.callbackRemove(prv.element,component));

	};

	prv.init();

};
