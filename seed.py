"""Data contoh. Dipanggil dari app.py saat database pertama kali dibuat."""
def isi(c, ustadzah_id="ustadzah"):
    murid = [(f"{ustadzah_id}-s1","Aisyah",1,"sore"),(f"{ustadzah_id}-s2","Budi",2,"sore"),
             (f"{ustadzah_id}-s3","Citra",3,"sore"),(f"{ustadzah_id}-s4","Dimas",4,"malam"),
             (f"{ustadzah_id}-s5","Eka",5,"malam")]
    c.executemany("INSERT INTO murid(id,ustadzah_id,nama,no_absen,kelas_id,status,tgl_masuk,pass_awal,ganti_sandi) "
                  "VALUES(?,?,?,?,?,'aktif','2026-07-01',?,0)", [(i,ustadzah_id,n,no,k,str(no)) for i,n,no,k in murid])
    caps = [(f"{ustadzah_id}-c1",f"{ustadzah_id}-s1","2026-10-12","sore",3,12,"Lanjut",0,"Masih tertukar huruf ba dan ta")]
    caps += [(f"{ustadzah_id}-b{i}",f"{ustadzah_id}-s2",f"2026-10-0{i+1}","sore",2,5+i,"Ulang",0,"") for i in range(4)]
    caps += [(f"{ustadzah_id}-c9",f"{ustadzah_id}-s3","2026-10-14","sore",6,40,"Lanjut",1,"Siap naik ke kelas malam")]
    c.executemany("INSERT INTO capaian(id,murid_id,tanggal,kelas_id,jilid_juz,halaman,hasil,lulus,catatan) "
                  "VALUES(?,?,?,'sore',?,?,?,?,?)", [(a,b,d,j,h,hs,l,n) for a,b,d,_,j,h,hs,l,n in caps])
    c.executemany("INSERT INTO materi(id,ustadzah_id,judul,mapel,kelas_id,isi) VALUES(?,?,?,?,'sore',?)", [
        (f"{ustadzah_id}-t1",ustadzah_id,"Mengenal huruf Alif sampai Tsa","Iqra’/Ummi","Ulangi membaca Alif, Ba, Ta, Tsa bersama anak 5 menit setiap hari."),
        (f"{ustadzah_id}-t2",ustadzah_id,"Berhitung 1 sampai 10","Berhitung","Minta anak menghitung benda di rumah, lalu menulis angkanya.")])
    c.execute("INSERT INTO soal_kuis VALUES(?,?, 'Huruf pertama hijaiyah adalah…','Alif','Ba','Ta','Jim',0)",
              (f"{ustadzah_id}-q1", ustadzah_id))