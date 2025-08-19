import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

const WYSIWYGEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Введіть текст...',
  height = '320px',
  readOnly = false
}) => {

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1,2,3,false] }],
      ['bold','italic','underline','strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote','code-block'],
      ['link','image'],
      ['clean']
    ]
  }), []);

  const formats = [
    'header','bold','italic','underline','strike',
    'color','background','list','bullet','align',
    'blockquote','code-block','link','image'
  ];

  return (
    <div className="wysiwyg-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{ minHeight: height }}
      />
    </div>
  );
};

export default WYSIWYGEditor;