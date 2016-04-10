<?php

namespace Controller\Managment;
use Arbor\Core\Controller;
use Arbor\Component\Form\TextField;
use Arbor\Component\Form\FileField;
use Formatter\BootstrapFormFormatter;
use Arbor\Exception\ValueNotFoundException;
use Arbor\Provider\Response;
class FormController extends Controller{
	

	public function index(){
		return array();
	}

	public function add(){
		$form=$this->createForm();

		$form->submit($this->getRequest());
		if(!$form->isValid()){
			return compact('form');
		}

		$data=$form->getData();

		$session=$this->getRequest()->getSession();
		$dir=__DIR__.'/../../cache/'.$session->getId();
		if(file_exists($dir)){
			$this->rrmdir($dir);
		}
		mkdir($dir,0777,true);

		$data['file']->save($dir,'raw.pdf');
		$sessionData=array(
			'name'=>$data['name'],
			'fileRaw'=>$dir.'/'.'raw.pdf',
			);
		$fileView=$this->convertPdfToImage($sessionData['fileRaw'],$dir);
		$sessionData=$sessionData+compact('fileView');

		$session->set('form.add',$sessionData);

		return $this->redirect('/managment/form/add/finish');

	}

	public function addFinish(){
		$request=$this->getRequest();
		$session=$this->getRequest()->getSession();
		$sessionData=null;
		try{
			$sessionData=$session->get('form.add');
		}
		catch(ValueNotFoundException $e){
			return $this->redirect('/managment/form/add');
		}

		if($request->getType()!="POST"){
			return $sessionData;
		}

		$form=new \Entity\Form();
		$form->setName($sessionData['name']);
		do{
			$dir=__DIR__.'../../upload/'.md5(microtime()+mt_srand());
		}while(file_exists($dir));
		$form->setDir($dir);
		$this->persist($form);
		$data=$request->getData();
		$data=$data['data'];
		foreach($data as $record){ //TODO validate fields!
			$formField=new \Entity\FormField();
			$formField->setName($record['name']);
			$formField->setPage($record['page']);
			$formField->setPositionX($record['positionX']);
			$formField->setPositionY($record['positionY']);
			$this->persist($formField);
		}

		$this->flush();

		rename($sessionData['fileRaw'], $dir.'/raw.pdf');//TODO move view files?

		return $this->redirect('/managment/form');


	}

	public function addFinishImage($image){
		$session=$this->getRequest()->getSession();
		$dir=__DIR__.'/../../cache/'.$session->getId();
		$response=new Response();
		$response->setContent($dir.'/'.$image);
		return $response;
	}

	private function convertPdfToImage($file,$dest){
		$convert = 'convert  -quality 100 ' . $file . ' '.$dest.'/view-%d.jpg'; // Command creating
		exec ($convert);
		$result=array();
		$opendir=opendir($dest);
		while($readdir=readdir($opendir)){
			if(!preg_match('/^view-\d\.jpg$/', $readdir)){
				continue;
			}
			$result[]=$readdir;

		}

		closedir($opendir);
		sort($result);
		return $result;
	}

	private function createForm(){
		$build=$this->getService('form')->create();
		$build->setValidatorService($this->getService('validator'));
		$build->setFormatter(new BootstrapFormFormatter());
		$build->addField(new TextField(array(
			'name'=>'name'
			,'label'=>'Name'
			,'required'=>true
			)));
		$build->addField(new FileField(array(
			'name'=>'file'
			,'label'=>'Pattern file'
			,'required'=>true
			)));

		return $build;

	}

	private function rrmdir($src) {
	    $dir = opendir($src);
	    while(false !== ( $file = readdir($dir)) ) {
	        if (( $file != '.' ) && ( $file != '..' )) {
	            $full = $src . '/' . $file;
	            if ( is_dir($full) ) {
	                rrmdir($full);
	            }
	            else {
	                unlink($full);
	            }
	        }
	    }
	    closedir($dir);
	    rmdir($src);
	}
}