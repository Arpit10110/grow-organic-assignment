import{ useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import type { ApiResponse, Artwork } from "./types";
import "./App.css"
const ROWS_PER_PAGE = 12;

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rowSelectionBuffer, setRowSelectionBuffer] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectCount, setSelectCount] = useState('');
  
  const overlayRef = useRef<OverlayPanel>(null);

  const fetchPageData = async (page: number): Promise<{ data: Artwork[], total: number }> => {
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${ROWS_PER_PAGE}`
      );
      const data: ApiResponse = await response.json();
      
      const mappedArtworks: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title || 'N/A',
        place_of_origin: item.place_of_origin || 'Unknown',
        artist_display: item.artist_display || 'Unknown Artist',
        inscriptions: item.inscriptions || 'N/A',
        date_start: item.date_start || 0,
        date_end: item.date_end || 0,
      }));

      return { data: mappedArtworks, total: data.pagination.total };
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      return { data: [], total: 0 };
    }
  };

  const fetchArtworks = useCallback(async (page: number) => {
    setLoading(true);
    const { data, total } = await fetchPageData(page);
    setArtworks(data);
    setTotalRecords(total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage, fetchArtworks]);

  useEffect(() => {
    if (rowSelectionBuffer > 0 && artworks.length > 0) {
      const newSelectedIds = new Set(selectedIds);
      let remaining = rowSelectionBuffer;
      let addedCount = 0;

      artworks.forEach(row => {
        if (remaining > 0 && !newSelectedIds.has(row.id)) {
          newSelectedIds.add(row.id);
          remaining--;
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setSelectedIds(newSelectedIds);
        setRowSelectionBuffer(remaining);
      }
    }
  }, [artworks, rowSelectionBuffer]);

  const selectedArtworks = artworks.filter(row => selectedIds.has(row.id));
  const onSelectionChange = (e: any) => {
    const currentIds = new Set(artworks.map(a => a.id));
    const newSelectedIds = new Set(selectedIds);
    for (const id of currentIds) {
      newSelectedIds.delete(id);
    }
    e.value.forEach((row: Artwork) => {
      newSelectedIds.add(row.id);
    });
    
    setSelectedIds(newSelectedIds);
  };
  const handleCustomSelect = () => {
    const count = parseInt(selectCount);
    if (!count || count <= 0 || isNaN(count)) {
      alert('Please enter a valid number');
      return;
    }

    const newSelectedIds = new Set(selectedIds);
    let remaining = count;

    artworks.forEach(row => {
      if (remaining > 0 && !newSelectedIds.has(row.id)) {
        newSelectedIds.add(row.id);
        remaining--;
      }
    });

    setRowSelectionBuffer(remaining);
    
    setSelectedIds(newSelectedIds);
    overlayRef.current?.hide();
    setSelectCount('');
  };

  const onPageChange = (event: any) => {
    setCurrentPage(event.page + 1);
  };

  const dateStartBodyTemplate = (rowData: Artwork) => (
    <span>{rowData.date_start ? rowData.date_start.toString() : 'N/A'}</span>
  );
  
  const dateEndBodyTemplate = (rowData: Artwork) => (
    <span>{rowData.date_end ? rowData.date_end.toString() : 'N/A'}</span>
  );

  const inscriptionsBodyTemplate = (rowData: Artwork) => (
    <span>{rowData.inscriptions === null ? 'N/A' : rowData.inscriptions}</span>
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="mb-4 text-sm text-blue-600 font-medium">
          Selected: {selectedIds.size + rowSelectionBuffer} rows 
          {rowSelectionBuffer > 0 && <span className="text-gray-500 ml-2">(Selection pending for {rowSelectionBuffer} rows on other pages)</span>}
        </div>

        <div className="card">
          <DataTable
            value={artworks}
            selection={selectedArtworks}
            onSelectionChange={onSelectionChange}
            selectionMode="checkbox"
            dataKey="id"
            lazy
            totalRecords={totalRecords}
            rows={ROWS_PER_PAGE}
            first={(currentPage - 1) * ROWS_PER_PAGE}
            onPage={onPageChange}
            loading={loading}
            tableStyle={{ minWidth: '80rem' }}
            paginator
            paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            paginatorLeft={<div/>} 
            paginatorClassName="justify-content-end"
            pt={{
                paginator: {
                    root: { className: 'flex justify-between items-center bg-white border-t border-gray-200 px-4 py-3 sm:px-6' },
                    currentReport: { className: 'text-sm text-gray-700' },
                    pages: { className: 'flex gap-1' },
                    firstPageButton: { className: 'hidden' },
                    lastPageButton: { className: 'hidden' },
                    previousPageButton: { className: 'relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50' },
                    nextPageButton: { className: 'relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ml-2' },
                    pageButton: ({ context }: any) => ({
                        className: `relative inline-flex items-center px-4 py-2 text-sm font-semibold ${context.active ? 'bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`
                    })
                },
                thead: { className: 'bg-gray-50' },
                headerRow: { className: 'bg-transparent' },
                headerCell: { className: 'text-xs font-bold text-gray-500 uppercase tracking-wider bg-transparent border-b border-gray-200 py-3' },
                bodyRow: { className: 'hover:bg-gray-50' },
                row: { className: 'border-b border-gray-100' }
            }}
            emptyMessage="No artworks found."
            stripedRows={false}
          >
            <Column 
              selectionMode="multiple" 
              headerStyle={{ width: '3rem' }} 
            />
            <Column 
              field="title" 
              header={() => (
                <div className="flex items-center gap-8 cursor-pointer" onClick={(e) => overlayRef.current?.toggle(e)}>
                  <i className="pi pi-chevron-down text-xs"></i>
                  TITLE
                </div>
              )} 
              style={{ minWidth: '20rem', fontWeight: 500 }}
            />
            <Column 
              field="place_of_origin" 
              header="PLACE OF ORIGIN" 
              style={{ minWidth: '12rem' }}
            />
            <Column 
              field="artist_display" 
              header="ARTIST" 
              style={{ minWidth: '18rem' }}
            />
            <Column 
              field="inscriptions" 
              header="INSCRIPTIONS" 
              body={inscriptionsBodyTemplate}
              style={{ minWidth: '15rem' }}
            />
            <Column 
              field="date_start" 
              header="START DATE" 
              body={dateStartBodyTemplate}
              style={{ width: '8rem' }}
            />
            <Column 
              field="date_end" 
              header="END DATE" 
              body={dateEndBodyTemplate}
              style={{ width: '8rem' }}
            />
          </DataTable>
        </div>

        <OverlayPanel 
          ref={overlayRef} 
          className="shadow-lg border border-gray-200 rounded-lg"
          style={{ width: '300px' }}
        >
          <div className="p-4">
            <h3 className="text-gray-900 font-medium mb-1">Select Multiple Rows</h3>
            <p className="text-sm text-gray-500 mb-3">
              Enter number of rows to select across all pages
            </p>
            
            <div className="flex gap-2">
              <InputText 
                value={selectCount}
                onChange={(e) => setSelectCount(e.target.value)}
                placeholder="e.g., 2"
                className="w-24 p-2 border border-gray-300 rounded text-sm"
                type="number"
                min="1"
              />
              <Button 
                label="Select" 
                className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-4 py-2 text-sm rounded font-medium"
                onClick={handleCustomSelect}
                text
              />
            </div>
          </div>
        </OverlayPanel>
      </div>
    </div>
  );
}
